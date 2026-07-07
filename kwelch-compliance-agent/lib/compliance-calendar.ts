// ── Compliance calendar: deadline generation + compliance score ─────────────
import type { ComplianceScoreResult, Deadline } from '@/types';
import { quarterlyDueDates } from './tax-engine';

export const ENTITY = {
  name: 'KWelchVisuals LLC',
  caEntityNumber: '202202610345',
  formationDate: '2022-01-23',
  status: 'ACTIVE',
  taxClassification: 'Sole proprietor / Schedule C (disregarded entity)',
  city: 'Fairfield',
  state: 'CA',
  owner: 'Keith Welch Jr.',
} as const;

export const CA_LLC_FACTS = {
  franchiseTax: {
    amount: 800,
    due: 'April 15 each year',
    penalty: '5% of unpaid tax + $5/month (0.5%/month) after 30 days late',
    url: 'https://www.ftb.ca.gov/file/business/types/limited-liability-company/index.html',
  },
  statementOfInformation: {
    amount: 20,
    cadence: 'Every 2 years (biennial), during the anniversary month of formation',
    url: 'https://bizfileonline.sos.ca.gov',
    // Formed Jan 2022 → SOI due in even years, window ends Jan 31.
  },
} as const;

export interface SeedDeadline {
  title: string;
  description: string;
  due_date: string;
  category: string;
  authority: string;
  amount_due: number | null;
  penalty_per_day: number | null;
  penalty_notes: string | null;
  severity: string;
  is_recurring: 0 | 1;
  recurrence_rule: string | null;
  source_url: string | null;
}

/** Statement of Information: biennial for a Jan-2022 formation → due Jan 31 of even years. */
export function nextSOIDueDate(fromYear: number): string {
  const year = fromYear % 2 === 0 ? fromYear : fromYear + 1;
  return `${year}-01-31`;
}

/** Generate the seed deadline set for a given calendar year. */
export function generateDeadlines(year: number): SeedDeadline[] {
  const deadlines: SeedDeadline[] = [];

  // 1. CA LLC Franchise Tax $800
  deadlines.push({
    title: `CA LLC Franchise Tax ($800) — ${year}`,
    description: `Annual $800 minimum franchise tax for KWelchVisuals LLC (#${ENTITY.caEntityNumber}). Pay via FTB Form 3522 / Web Pay.`,
    due_date: `${year}-04-15`,
    category: 'franchise_tax',
    authority: 'CA FTB',
    amount_due: 800,
    penalty_per_day: null,
    penalty_notes: CA_LLC_FACTS.franchiseTax.penalty,
    severity: 'critical',
    is_recurring: 1,
    recurrence_rule: 'yearly:04-15',
    source_url: CA_LLC_FACTS.franchiseTax.url,
  });

  // 2. CA Statement of Information $20 (biennial)
  const soiDue = nextSOIDueDate(year);
  deadlines.push({
    title: 'CA Statement of Information ($20) — biennial',
    description: `Biennial Statement of Information (Form LLC-12) for KWelchVisuals LLC. File online at bizfileonline.sos.ca.gov. $250 penalty if not filed after notice.`,
    due_date: soiDue,
    category: 'statement_of_information',
    authority: 'CA SOS',
    amount_due: 20,
    penalty_per_day: null,
    penalty_notes: '$250 SOS penalty if delinquent after notice; possible suspension.',
    severity: 'high',
    is_recurring: 1,
    recurrence_rule: 'biennial:01-31',
    source_url: CA_LLC_FACTS.statementOfInformation.url,
  });

  // 3-6. Federal estimated taxes Q1-Q4  |  7. CA FTB estimated Q1-Q4 (same dates)
  for (const q of quarterlyDueDates(year)) {
    deadlines.push({
      title: `Federal Estimated Tax ${q.label} ${year} (Form 1040-ES)`,
      description: `Quarterly federal estimated income + self-employment tax payment for ${q.label} ${year}. Pay at irs.gov/payments.`,
      due_date: q.dueDate,
      category: 'federal_estimated',
      authority: 'IRS',
      amount_due: null,
      penalty_per_day: null,
      penalty_notes: 'Underpayment penalty accrues at the federal short-term rate + 3% (IRC §6654).',
      severity: 'high',
      is_recurring: 1,
      recurrence_rule: `yearly:${q.dueDate.slice(5)}`,
      source_url: 'https://www.irs.gov/payments',
    });
    if (q.quarter !== 3) {
      // CA has no Q3 estimated payment (30/40/0/30 weighting) but we track the
      // same statutory dates the FTB publishes — skip $0 Q3.
      deadlines.push({
        title: `CA FTB Estimated Tax ${q.label} ${year} (Form 540-ES)`,
        description: `California quarterly estimated tax payment for ${q.label} ${year} (30%/40%/0%/30% weighting). Pay via FTB Web Pay.`,
        due_date: q.dueDate,
        category: 'ca_estimated',
        authority: 'CA FTB',
        amount_due: null,
        penalty_per_day: null,
        penalty_notes: 'FTB underpayment penalty per R&TC §19136.',
        severity: 'high',
        is_recurring: 1,
        recurrence_rule: `yearly:${q.dueDate.slice(5)}`,
        source_url: 'https://www.ftb.ca.gov/pay/estimated-tax-payments.html',
      });
    }
  }

  // 8. Federal return 1040 + Schedule C
  deadlines.push({
    title: `Federal Tax Return ${year - 1} (Form 1040 + Schedule C)`,
    description: `Personal return with Schedule C for KWelchVisuals LLC covering tax year ${year - 1}. Extension available to Oct 15 (payment still due Apr 15).`,
    due_date: `${year}-04-15`,
    category: 'federal_return',
    authority: 'IRS',
    amount_due: null,
    penalty_per_day: null,
    penalty_notes: 'Failure-to-file: 5%/month up to 25%. Failure-to-pay: 0.5%/month.',
    severity: 'critical',
    is_recurring: 1,
    recurrence_rule: 'yearly:04-15',
    source_url: 'https://www.irs.gov/forms-pubs/about-form-1040',
  });

  // 9. CA Form 540
  deadlines.push({
    title: `CA Form 540 — ${year - 1} State Return`,
    description: `California resident income tax return for tax year ${year - 1}, including LLC income (plus Form 568 for the LLC).`,
    due_date: `${year}-04-15`,
    category: 'ca_return',
    authority: 'CA FTB',
    amount_due: null,
    penalty_per_day: null,
    penalty_notes: 'Late-file penalty 5%/month up to 25% of unpaid tax.',
    severity: 'critical',
    is_recurring: 1,
    recurrence_rule: 'yearly:04-15',
    source_url: 'https://www.ftb.ca.gov/forms/2024/2024-540.pdf',
  });

  return deadlines;
}

/**
 * Compliance score 0-100.
 *  -20 per overdue critical deadline
 *  -10 per overdue high deadline
 *   -5 per unpaid deadline due within 7 days
 */
export function computeComplianceScore(
  deadlines: Pick<Deadline, 'due_date' | 'severity' | 'status'>[],
): ComplianceScoreResult {
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const open = deadlines.filter((d) => !['paid', 'filed', 'waived'].includes(d.status));

  const penalties: { reason: string; points: number }[] = [];
  for (const d of open) {
    if (d.due_date < today) {
      if (d.severity === 'critical') penalties.push({ reason: 'Overdue critical deadline', points: 20 });
      else if (d.severity === 'high') penalties.push({ reason: 'Overdue high-priority deadline', points: 10 });
      else penalties.push({ reason: 'Overdue deadline', points: 5 });
    } else if (d.due_date <= in7) {
      penalties.push({ reason: 'Unpaid deadline due within 7 days', points: 5 });
    }
  }

  const score = Math.max(0, 100 - penalties.reduce((s, p) => s + p.points, 0));
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  return { score, grade, deductions: penalties };
}
