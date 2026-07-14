// Manual financials entry — the no-token fallback. Creates a qb_snapshot so
// tax analysis, the dashboard, and the AI agent context work before the
// QuickBooks MCP connection is authorized.
import { getDb, addAlert } from '@/lib/db';
import type { QBSnapshot } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<{
    gross_revenue: number;
    total_expenses: number;
    unpaid_invoices_total: number;
    unpaid_invoices_count: number;
  }>;

  const revenue = Number(body.gross_revenue);
  const expenses = Number(body.total_expenses);
  if (!Number.isFinite(revenue) || !Number.isFinite(expenses) || revenue < 0 || expenses < 0) {
    return Response.json(
      { error: 'gross_revenue and total_expenses are required (non-negative numbers).' },
      { status: 400 },
    );
  }

  const net = revenue - expenses;
  const unpaidTotal = Number.isFinite(Number(body.unpaid_invoices_total)) ? Number(body.unpaid_invoices_total) : 0;
  const unpaidCount = Number.isFinite(Number(body.unpaid_invoices_count))
    ? Math.max(0, Math.round(Number(body.unpaid_invoices_count)))
    : 0;

  const year = new Date().getFullYear();
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO qb_snapshots
        (period_start, period_end, gross_revenue, total_expenses, net_profit,
         unpaid_invoices_total, unpaid_invoices_count, ar_over_30, raw_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    )
    .run(
      `${year}-01-01`,
      new Date().toISOString().slice(0, 10),
      revenue,
      expenses,
      net,
      unpaidTotal,
      unpaidCount,
      JSON.stringify({ source: 'manual', notes: 'Entered manually — replace with a QuickBooks sync when authorized.' }),
    );

  addAlert(
    'quickbooks',
    'low',
    'Manual financials saved',
    `Net profit $${net.toLocaleString()} on $${revenue.toLocaleString()} revenue. Tax analysis is now live — run a real QuickBooks sync when the connection is authorized.`,
  );

  const snapshot = db.prepare(`SELECT * FROM qb_snapshots WHERE id = ?`).get(info.lastInsertRowid) as QBSnapshot;
  return Response.json({ snapshot });
}
