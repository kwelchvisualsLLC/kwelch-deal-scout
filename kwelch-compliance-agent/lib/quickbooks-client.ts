// ── QuickBooks integration ──────────────────────────────────────────────────
// Calls the Intuit QuickBooks MCP server (https://ai-inc.quickbooks.intuit.com/v1/mcp)
// through the Anthropic API's MCP connector: Claude is given the QB toolset and
// asked to pull P&L, AR aging, AP aging, and cash flow, returning a structured
// JSON summary. Results are cached in SQLite for 30 minutes.
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from './db';
import type { QBSnapshot } from '@/types';

const QB_MCP_URL = process.env.QB_MCP_URL || 'https://ai-inc.quickbooks.intuit.com/v1/mcp';
const CACHE_MINUTES = 30;

export interface QBFinancials {
  period_start: string;
  period_end: string;
  gross_revenue: number;
  total_expenses: number;
  net_profit: number;
  unpaid_invoices_total: number;
  unpaid_invoices_count: number;
  ar_over_30: number;
  expense_categories: { category: string; amount: number }[];
  notes: string;
}

export function getLatestSnapshot(): QBSnapshot | null {
  const db = getDb();
  return (db
    .prepare(`SELECT * FROM qb_snapshots ORDER BY sync_date DESC LIMIT 1`)
    .get() as QBSnapshot | undefined) ?? null;
}

export function getFreshSnapshot(): QBSnapshot | null {
  const snap = getLatestSnapshot();
  if (!snap) return null;
  const ageMs = Date.now() - new Date(snap.sync_date.replace(' ', 'T') + 'Z').getTime();
  return ageMs < CACHE_MINUTES * 60_000 ? snap : null;
}

/**
 * Sync financials from QuickBooks via the MCP connector.
 * Returns the stored snapshot. Throws with a descriptive message when the
 * QuickBooks connection isn't authorized yet.
 */
export async function syncQuickBooks(force = false): Promise<QBSnapshot> {
  if (!force) {
    const cached = getFreshSnapshot();
    if (cached) return cached;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set — add it to .env.local');

  const client = new Anthropic({ apiKey });
  const year = new Date().getFullYear();

  const qbToken = process.env.QB_MCP_ACCESS_TOKEN;
  const response = await client.beta.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    betas: ['mcp-client-2025-11-20'],
    mcp_servers: [
      {
        type: 'url',
        url: QB_MCP_URL,
        name: 'quickbooks',
        ...(qbToken ? { authorization_token: qbToken } : {}),
      },
    ],
    tools: [{ type: 'mcp_toolset', mcp_server_name: 'quickbooks' }],
    system:
      'You are a financial data extraction agent for KWelchVisuals LLC. ' +
      'Use the QuickBooks tools to pull the profit & loss report (year to date), ' +
      'AR aging summary, AP aging summary, and cash flow. Then respond with ONLY a JSON object ' +
      '(no markdown fence, no commentary) matching this exact shape: ' +
      '{"period_start":"YYYY-MM-DD","period_end":"YYYY-MM-DD","gross_revenue":0,"total_expenses":0,' +
      '"net_profit":0,"unpaid_invoices_total":0,"unpaid_invoices_count":0,"ar_over_30":0,' +
      '"expense_categories":[{"category":"","amount":0}],"notes":""}',
    messages: [
      {
        role: 'user',
        content: `Pull KWelchVisuals LLC financials for Jan 1 ${year} through today and return the JSON summary.`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const parsed = extractJson(text);
  if (!parsed) {
    throw new Error(
      'QuickBooks sync failed: could not read financial data. ' +
        'Make sure the QuickBooks connection is authorized (QB_MCP_ACCESS_TOKEN in .env.local). ' +
        `Agent said: ${text.slice(0, 300)}`,
    );
  }

  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO qb_snapshots
        (period_start, period_end, gross_revenue, total_expenses, net_profit,
         unpaid_invoices_total, unpaid_invoices_count, ar_over_30, raw_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      parsed.period_start ?? null,
      parsed.period_end ?? null,
      num(parsed.gross_revenue),
      num(parsed.total_expenses),
      num(parsed.net_profit),
      num(parsed.unpaid_invoices_total),
      Math.round(num(parsed.unpaid_invoices_count)),
      num(parsed.ar_over_30),
      JSON.stringify(parsed),
    );

  return db.prepare(`SELECT * FROM qb_snapshots WHERE id = ?`).get(info.lastInsertRowid) as QBSnapshot;
}

function extractJson(text: string): Partial<QBFinancials> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v.replace(/[$,]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : 0;
}
