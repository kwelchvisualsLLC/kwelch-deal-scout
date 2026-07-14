// ── KWELCH COMPLIANCE AGENT — shared types ──────────────────────────────────

export type DeadlineCategory =
  | 'franchise_tax'
  | 'statement_of_information'
  | 'federal_estimated'
  | 'ca_estimated'
  | 'federal_return'
  | 'ca_return'
  | 'other';

export type Authority = 'IRS' | 'CA FTB' | 'CA SOS' | 'OTHER';

export type DeadlineStatus = 'upcoming' | 'due_soon' | 'overdue' | 'paid' | 'filed' | 'waived';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Deadline {
  id: number;
  title: string;
  description: string | null;
  due_date: string; // ISO date
  category: DeadlineCategory;
  authority: Authority;
  amount_due: number | null;
  penalty_per_day: number | null;
  penalty_notes: string | null;
  severity: Severity;
  status: DeadlineStatus;
  is_recurring: 0 | 1;
  recurrence_rule: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: number;
  business_name: string;
  owner_name: string;
  ein_encrypted: string | null;
  ein_last4: string | null;
  ca_entity_number: string;
  formation_date: string;
  tax_classification: string;
  state: string;
  city: string;
  entity_status: string;
  fiscal_year_end: string;
  updated_at: string;
}

export interface QBSnapshot {
  id: number;
  sync_date: string;
  period_start: string | null;
  period_end: string | null;
  gross_revenue: number;
  total_expenses: number;
  net_profit: number;
  unpaid_invoices_total: number;
  unpaid_invoices_count: number;
  ar_over_30: number;
  raw_summary: string | null;
}

export interface Deduction {
  id: number;
  category: string;
  description: string;
  estimated_amount: number;
  confidence: 'high' | 'medium' | 'low';
  tax_year: number;
  section: string | null;
  notes: string | null;
  created_at: string;
}

export interface TaxEstimate {
  id: number;
  tax_year: number;
  quarter: number;
  due_date: string;
  federal_amount: number;
  ca_amount: number;
  status: 'unpaid' | 'paid' | 'scheduled';
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RefundItem {
  id: number;
  source: string;
  description: string;
  estimated_amount: number | null;
  status: 'unchecked' | 'checking' | 'potential' | 'claimed' | 'none_found';
  action_url: string | null;
  last_checked: string | null;
  notes: string | null;
}

export interface Alert {
  id: number;
  type: string;
  severity: Severity;
  title: string;
  message: string;
  is_read: 0 | 1;
  created_at: string;
}

// ── Tax engine ──────────────────────────────────────────────────────────────

export interface TaxInput {
  taxYear: number;
  netBusinessIncome: number; // Schedule C net profit
  otherIncome?: number;
  filingStatus?: 'single';
  useStandardDeduction?: boolean;
  itemizedDeduction?: number;
}

export interface TaxBreakdown {
  taxYear: number;
  netBusinessIncome: number;
  seTaxableBase: number; // net x 0.9235
  seTax: number;
  seSocialSecurity: number;
  seMedicare: number;
  seDeduction: number; // half of SE tax
  agi: number;
  standardDeduction: number;
  qbiDeduction: number;
  federalTaxableIncome: number;
  federalIncomeTax: number;
  federalTotalTax: number; // income tax + SE tax
  federalEffectiveRate: number;
  federalMarginalRate: number;
  caTaxableIncome: number;
  caIncomeTax: number;
  caMentalHealthTax: number;
  caFranchiseTax: number; // $800 LLC minimum
  caTotalTax: number;
  caEffectiveRate: number;
  caMarginalRate: number;
  totalTax: number;
  quarterly: QuarterlyEstimate[];
}

export interface QuarterlyEstimate {
  quarter: 1 | 2 | 3 | 4;
  label: string;
  dueDate: string;
  federalAmount: number;
  caAmount: number;
  total: number;
}

export interface ComplianceScoreResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  deductions: { reason: string; points: number }[];
}
