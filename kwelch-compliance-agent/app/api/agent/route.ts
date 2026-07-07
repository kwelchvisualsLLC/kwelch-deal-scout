// Streaming AI Tax Agent — Claude with web search enabled.
// GET  → chat history
// POST → { message } → SSE stream of text deltas
// DELETE → clear history
import Anthropic from '@anthropic-ai/sdk';
import { getDb, getDeadlines } from '@/lib/db';
import { getLatestSnapshot } from '@/lib/quickbooks-client';
import { computeComplianceScore } from '@/lib/compliance-calendar';
import type { ChatMessage, Deadline } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are KWELCH COMPLIANCE AGENT — private AI tax strategist for Keith Welch Jr., KWelchVisuals LLC, Fairfield CA. CA single-member LLC, Schedule C filer. You know his CA $800 franchise tax is due April 15, his entity #202202610345 is active. You are a senior CPA partner — direct, specific, no hedging. Always calculate federal AND California simultaneously. Always show exact dollar amounts. Use web search to verify current IRS/FTB deadlines before answering. End every recommendation: 'Disclaimer: Not licensed tax advice. Verify with a licensed fiduciary.'`;

export async function GET() {
  const db = getDb();
  const messages = db
    .prepare(`SELECT * FROM chat_messages ORDER BY id ASC LIMIT 200`)
    .all() as ChatMessage[];
  return Response.json({ messages });
}

export async function DELETE() {
  getDb().prepare(`DELETE FROM chat_messages`).run();
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const { message } = (await request.json()) as { message?: string };
  if (!message?.trim()) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it to .env.local and restart.' },
      { status: 500 },
    );
  }

  const db = getDb();
  db.prepare(`INSERT INTO chat_messages (role, content) VALUES ('user', ?)`).run(message.trim());

  // Conversation history (last 20 turns) + live financial context.
  const history = db
    .prepare(`SELECT role, content FROM chat_messages ORDER BY id DESC LIMIT 20`)
    .all()
    .reverse() as { role: 'user' | 'assistant'; content: string }[];

  const contextBlock = buildContextBlock();

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      let assistantText = '';
      try {
        const anthropicStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'text', text: contextBlock },
          ],
          tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of anthropicStream) {
          if (event.type === 'content_block_start' && event.content_block.type === 'server_tool_use') {
            send('status', { status: 'Searching the web…' });
          }
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            assistantText += event.delta.text;
            send('delta', { text: event.delta.text });
          }
        }
        await anthropicStream.finalMessage();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        send('error', { error: msg });
      } finally {
        if (assistantText.trim()) {
          db.prepare(`INSERT INTO chat_messages (role, content) VALUES ('assistant', ?)`).run(assistantText);
        }
        send('done', { ok: true });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

/** Live context: QB numbers, deadline status, compliance score. EIN is never included. */
function buildContextBlock(): string {
  const lines: string[] = ['<live_context>'];
  lines.push(`Today: ${new Date().toISOString().slice(0, 10)}`);

  const snap = getLatestSnapshot();
  if (snap) {
    lines.push(
      `QuickBooks (synced ${snap.sync_date}): YTD revenue $${snap.gross_revenue.toLocaleString()}, ` +
        `expenses $${snap.total_expenses.toLocaleString()}, net profit $${snap.net_profit.toLocaleString()}, ` +
        `unpaid invoices $${snap.unpaid_invoices_total.toLocaleString()} (${snap.unpaid_invoices_count}).`,
    );
  } else {
    lines.push('QuickBooks: not yet synced — no live financials available.');
  }

  const deadlines = getDeadlines() as Deadline[];
  const open = deadlines.filter((d) => !['paid', 'filed', 'waived'].includes(d.status));
  const score = computeComplianceScore(deadlines);
  lines.push(`Compliance score: ${score.score}/100 (${score.grade}).`);
  const soon = open.slice(0, 6);
  if (soon.length) {
    lines.push('Next deadlines:');
    for (const d of soon) {
      lines.push(`- ${d.due_date} · ${d.title} · ${d.status}${d.amount_due ? ` · $${d.amount_due}` : ''}`);
    }
  }
  lines.push('</live_context>');
  return lines.join('\n');
}
