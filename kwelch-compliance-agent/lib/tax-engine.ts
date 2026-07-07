// ── Tax engine: CA single-member LLC (Schedule C, single filer) ─────────────
// Computes SE tax, federal income tax, CA income tax, QBI, and quarterly
// estimates. Bracket data is keyed by tax year; unknown years fall back to
// the latest configured year.

import type { TaxBreakdown, TaxInput, QuarterlyEstimate } from '@/types';

interface Bracket {
  rate: number;
  upTo: number; // upper bound of the bracket (Infinity for top)
}

interface YearConstants {
  standardDeductionSingle: number;
  caStandardDeductionSingle: number;
  federalBrackets: Bracket[];
  caBrackets: Bracket[];
  ssWageBase: number;
  mileageRate: number;
}

// 2024 constants per spec (single filer).
const TAX_CONSTANTS: Record<number, YearConstants> = {
  2024: {
    standardDeductionSingle: 14600,
    caStandardDeductionSingle: 5540,
    federalBrackets: [
      { rate: 0.10, upTo: 11600 },
      { rate: 0.12, upTo: 47150 },
      { rate: 0.22, upTo: 100525 },
      { rate: 0.24, upTo: 191950 },
      { rate: 0.32, upTo: 243725 },
      { rate: 0.35, upTo: 609350 },
      { rate: 0.37, upTo: Infinity },
    ],
    caBrackets: [
      { rate: 0.01, upTo: 10756 },
      { rate: 0.02, upTo: 25499 },
      { rate: 0.04, upTo: 40245 },
      { rate: 0.06, upTo: 55866 },
      { rate: 0.08, upTo: 70606 },
      { rate: 0.093, upTo: 360659 },
      { rate: 0.103, upTo: 432787 },
      { rate: 0.113, upTo: 721314 },
      { rate: 0.123, upTo: Infinity },
    ],
    ssWageBase: 168600,
    mileageRate: 0.67,
  },
};

const LATEST_YEAR = Math.max(...Object.keys(TAX_CONSTANTS).map(Number));

export const CA_FRANCHISE_TAX = 800;
export const SE_TAX_FACTOR = 0.9235;
export const SE_TAX_RATE = 0.153; // 12.4% SS + 2.9% Medicare
export const QBI_RATE = 0.2;
export const SEP_IRA_MAX_2024 = 69000;

export function constantsFor(year: number): YearConstants {
  return TAX_CONSTANTS[year] ?? TAX_CONSTANTS[LATEST_YEAR];
}

function taxFromBrackets(taxable: number, brackets: Bracket[]): number {
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (taxable <= prev) break;
    const inBracket = Math.min(taxable, b.upTo) - prev;
    tax += inBracket * b.rate;
    prev = b.upTo;
  }
  return tax;
}

function marginalRate(taxable: number, brackets: Bracket[]): number {
  let prev = 0;
  for (const b of brackets) {
    if (taxable <= b.upTo && taxable > prev) return b.rate;
    prev = b.upTo;
  }
  return taxable <= 0 ? brackets[0].rate : brackets[brackets.length - 1].rate;
}

/** Federal + CA estimated-tax due dates for a tax year. */
export function quarterlyDueDates(taxYear: number): { quarter: 1 | 2 | 3 | 4; label: string; dueDate: string }[] {
  return [
    { quarter: 1, label: 'Q1', dueDate: `${taxYear}-04-15` },
    { quarter: 2, label: 'Q2', dueDate: `${taxYear}-06-15` },
    { quarter: 3, label: 'Q3', dueDate: `${taxYear}-09-15` },
    { quarter: 4, label: 'Q4', dueDate: `${taxYear + 1}-01-15` },
  ];
}

/**
 * Full federal + California tax analysis for a CA single-member LLC
 * (disregarded entity, Schedule C, single filer).
 */
export function calculateTaxes(input: TaxInput): TaxBreakdown {
  const year = input.taxYear;
  const c = constantsFor(year);
  const net = Math.max(0, input.netBusinessIncome);
  const otherIncome = input.otherIncome ?? 0;

  // ── Self-employment tax ──
  const seBase = net * SE_TAX_FACTOR;
  const ssPortion = Math.min(seBase, c.ssWageBase) * 0.124;
  const medicarePortion = seBase * 0.029;
  const seTax = net > 400 ? ssPortion + medicarePortion : 0;
  const seDeduction = seTax / 2;

  // ── Federal ──
  const agi = net + otherIncome - seDeduction;
  const standardDeduction = input.useStandardDeduction === false && input.itemizedDeduction
    ? input.itemizedDeduction
    : c.standardDeductionSingle;
  // QBI: 20% of QBI, limited to 20% of (taxable income before QBI).
  const taxableBeforeQBI = Math.max(0, agi - standardDeduction);
  const qbiBase = Math.max(0, net - seDeduction);
  const qbiDeduction = Math.min(qbiBase * QBI_RATE, taxableBeforeQBI * QBI_RATE);
  const federalTaxable = Math.max(0, taxableBeforeQBI - qbiDeduction);
  const federalIncomeTax = taxFromBrackets(federalTaxable, c.federalBrackets);
  const federalTotal = federalIncomeTax + seTax;

  // ── California (no QBI, no SE tax; SE deduction conforms) ──
  const caTaxable = Math.max(0, agi - c.caStandardDeductionSingle);
  const caIncomeTax = taxFromBrackets(caTaxable, c.caBrackets);
  const caMentalHealthTax = caTaxable > 1_000_000 ? (caTaxable - 1_000_000) * 0.01 : 0;
  const caTotal = caIncomeTax + caMentalHealthTax + CA_FRANCHISE_TAX;

  // ── Quarterly estimates ──
  // Federal: 4 equal installments. CA weighting: 30% / 40% / 0% / 30%.
  const caWeights = [0.3, 0.4, 0, 0.3];
  const caEstimatedBase = caIncomeTax + caMentalHealthTax; // franchise tax paid separately
  const quarterly: QuarterlyEstimate[] = quarterlyDueDates(year).map((q, i) => {
    const fed = round2(federalTotal / 4);
    const ca = round2(caEstimatedBase * caWeights[i]);
    return {
      quarter: q.quarter,
      label: `${q.label} ${year}`,
      dueDate: q.dueDate,
      federalAmount: fed,
      caAmount: ca,
      total: round2(fed + ca),
    };
  });

  const totalIncome = net + otherIncome;
  return {
    taxYear: year,
    netBusinessIncome: net,
    seTaxableBase: round2(seBase),
    seTax: round2(seTax),
    seSocialSecurity: round2(ssPortion),
    seMedicare: round2(medicarePortion),
    seDeduction: round2(seDeduction),
    agi: round2(agi),
    standardDeduction,
    qbiDeduction: round2(qbiDeduction),
    federalTaxableIncome: round2(federalTaxable),
    federalIncomeTax: round2(federalIncomeTax),
    federalTotalTax: round2(federalTotal),
    federalEffectiveRate: totalIncome > 0 ? federalTotal / totalIncome : 0,
    federalMarginalRate: marginalRate(federalTaxable, c.federalBrackets),
    caTaxableIncome: round2(caTaxable),
    caIncomeTax: round2(caIncomeTax),
    caMentalHealthTax: round2(caMentalHealthTax),
    caFranchiseTax: CA_FRANCHISE_TAX,
    caTotalTax: round2(caTotal),
    caEffectiveRate: totalIncome > 0 ? caTotal / totalIncome : 0,
    caMarginalRate: marginalRate(caTaxable, c.caBrackets),
    totalTax: round2(federalTotal + caTotal),
    quarterly,
  };
}

/** SEP-IRA contribution limit: 25% of net SE income after SE deduction, capped. */
export function sepIraLimit(netBusinessIncome: number): number {
  const seBase = netBusinessIncome * SE_TAX_FACTOR;
  const seTax = seBase * SE_TAX_RATE;
  const adjusted = netBusinessIncome - seTax / 2;
  // Effective 20% of adjusted net earnings for self-employed.
  return round2(Math.min(adjusted * 0.2, SEP_IRA_MAX_2024));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
