// CA SOS entity status check. Known facts are hardcoded (entity #202202610345,
// ACTIVE, formed 2022-01-23); an optional live verification asks Claude with
// web search to confirm current standing on bizfileonline.sos.ca.gov.
import Anthropic from '@anthropic-ai/sdk';
import { ENTITY, CA_LLC_FACTS, nextSOIDueDate } from '@/lib/compliance-calendar';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    entity: ENTITY,
    facts: CA_LLC_FACTS,
    next_soi_due: nextSOIDueDate(new Date().getFullYear()),
  });
}

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set.' }, { status: 500 });
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
      messages: [
        {
          role: 'user',
          content:
            `Search California Secretary of State records (bizfileonline.sos.ca.gov) for ` +
            `"KWelchVisuals LLC" entity number ${ENTITY.caEntityNumber}. ` +
            `Report: current status (Active/Suspended/etc), agent for service of process if listed, ` +
            `and whether any Statement of Information appears delinquent. ` +
            `Respond in 3-5 short bullet points. If records can't be reached, say so plainly.`,
        },
      ],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    return Response.json({ checked_at: new Date().toISOString(), result: text });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'SOS check failed' },
      { status: 502 },
    );
  }
}
