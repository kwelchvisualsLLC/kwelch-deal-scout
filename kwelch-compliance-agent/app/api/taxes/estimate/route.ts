// Tax analysis: computes federal + CA liability and quarterly estimates.
// Uses QB net profit by default; accepts an override { netIncome, taxYear }.
import { getDb } from '@/lib/db';
import { getLatestSnapshot } from '@/lib/quickbooks-client';
import { calculateTaxes, sepIraLimit, annualizeYtd } from '@/lib/tax-engine';
import type { TaxEstimate } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const year = new Date().getFullYear();
  const estimates = db
    .prepare(`SELECT * FROM tax_estimates WHERE tax_year = ? ORDER BY quarter ASC`)
    .all(year) as TaxEstimate[];
  const snapshot = getLatestSnapshot();
  return Response.json({ estimates, snapshot });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { netIncome?: number; taxYear?: number };
  const snapshot = getLatestSnapshot();
  const taxYear = body.taxYear ?? new Date().getFullYear();
  const netIncome = body.netIncome ?? snapshot?.net_profit;

  if (netIncome === undefined || netIncome === null) {
    return Response.json(
      { error: 'No income data. Sync QuickBooks or enter a projected net income.' },
      { status: 400 },
    );
  }

  // Annualize a partial-year QB figure when using synced data mid-year.
  let annualized = netIncome;
  let annualizationNote: string | null = null;
  if (body.netIncome === undefined && snapshot) {
    ({ annualized, note: annualizationNote } = annualizeYtd(netIncome));
  }

  const breakdown = calculateTaxes({ taxYear, netBusinessIncome: annualized });

  // Persist quarterly estimates (preserve paid status where quarters already exist).
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO tax_estimates (tax_year, quarter, due_date, federal_amount, ca_amount)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(tax_year, quarter) DO UPDATE SET
      due_date = excluded.due_date,
      federal_amount = excluded.federal_amount,
      ca_amount = excluded.ca_amount
  `);
  const tx = db.transaction(() => {
    for (const q of breakdown.quarterly) {
      upsert.run(taxYear, q.quarter, q.dueDate, q.federalAmount, q.caAmount);
    }
  });
  tx();

  return Response.json({
    breakdown,
    sepIraLimit: sepIraLimit(annualized),
    annualizationNote,
    inputNetIncome: netIncome,
    annualizedNetIncome: annualized,
  });
}
