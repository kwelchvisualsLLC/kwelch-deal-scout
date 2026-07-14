import { syncQuickBooks, getLatestSnapshot } from '@/lib/quickbooks-client';
import { addAlert } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ snapshot: getLatestSnapshot() });
}

export async function POST(request: Request) {
  const force = new URL(request.url).searchParams.get('force') === '1';
  try {
    const snapshot = await syncQuickBooks(force);
    addAlert(
      'quickbooks',
      'low',
      'QuickBooks sync complete',
      `Net profit $${snapshot.net_profit.toLocaleString()} on $${snapshot.gross_revenue.toLocaleString()} revenue. Unpaid invoices: $${snapshot.unpaid_invoices_total.toLocaleString()}.`,
    );
    return Response.json({ snapshot });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'QuickBooks sync failed';
    return Response.json({ error: msg }, { status: 502 });
  }
}
