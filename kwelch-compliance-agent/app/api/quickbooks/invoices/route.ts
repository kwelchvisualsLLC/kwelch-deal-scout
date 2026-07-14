// Unpaid-invoice (AR) view derived from the latest QuickBooks snapshot.
import { getLatestSnapshot } from '@/lib/quickbooks-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = getLatestSnapshot();
  if (!snapshot) return Response.json({ synced: false, invoices: null });

  let detail: unknown = null;
  try {
    detail = snapshot.raw_summary ? JSON.parse(snapshot.raw_summary) : null;
  } catch {
    detail = null;
  }
  return Response.json({
    synced: true,
    sync_date: snapshot.sync_date,
    unpaid_total: snapshot.unpaid_invoices_total,
    unpaid_count: snapshot.unpaid_invoices_count,
    ar_over_30: snapshot.ar_over_30,
    detail,
  });
}
