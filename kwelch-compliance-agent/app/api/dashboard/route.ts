// Dashboard aggregate: score, next deadlines, unread alerts, QB stats.
import { getDb, getDeadlines, addAlert } from '@/lib/db';
import { computeComplianceScore } from '@/lib/compliance-calendar';
import { getLatestSnapshot } from '@/lib/quickbooks-client';
import { calculateTaxes, annualizeYtd } from '@/lib/tax-engine';
import type { Alert, Deadline } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const deadlines = getDeadlines() as Deadline[];
  const score = computeComplianceScore(deadlines);
  const snapshot = getLatestSnapshot();

  // Raise alerts for overdue / imminent deadlines (deduped inside addAlert).
  const open = deadlines.filter((d) => !['paid', 'filed', 'waived'].includes(d.status));
  for (const d of open) {
    if (d.status === 'overdue') {
      addAlert('deadline', d.severity, `OVERDUE: ${d.title}`, `${d.title} was due ${d.due_date}. ${d.penalty_notes ?? ''}`);
    } else if (d.status === 'due_soon') {
      addAlert('deadline', 'medium', `Due soon: ${d.title}`, `${d.title} is due ${d.due_date}.`);
    }
  }

  const upcoming = open.filter((d) => d.status !== 'overdue').slice(0, 5);
  const overdue = open.filter((d) => d.status === 'overdue');
  const alerts = db
    .prepare(`SELECT * FROM alerts WHERE is_read = 0 ORDER BY created_at DESC LIMIT 10`)
    .all() as Alert[];

  const taxes = snapshot && snapshot.net_profit > 0
    ? calculateTaxes({
        taxYear: new Date().getFullYear(),
        netBusinessIncome: annualizeYtd(snapshot.net_profit).annualized,
      })
    : null;

  return Response.json({
    score,
    upcoming,
    overdue,
    alerts,
    snapshot,
    taxes: taxes
      ? {
          federalTotalTax: taxes.federalTotalTax,
          caTotalTax: taxes.caTotalTax,
          totalTax: taxes.totalTax,
          nextQuarterly: taxes.quarterly.find((q) => q.dueDate >= new Date().toISOString().slice(0, 10)) ?? null,
        }
      : null,
  });
}
