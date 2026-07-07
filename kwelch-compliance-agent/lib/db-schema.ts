// SQLite schema. All queries throughout the app are parameterized.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS business_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'KWelchVisuals LLC',
  owner_name TEXT NOT NULL DEFAULT 'Keith Welch Jr.',
  ein_encrypted TEXT,
  ein_last4 TEXT,
  ca_entity_number TEXT NOT NULL DEFAULT '202202610345',
  formation_date TEXT NOT NULL DEFAULT '2022-01-23',
  tax_classification TEXT NOT NULL DEFAULT 'Sole proprietor / Schedule C (disregarded entity)',
  state TEXT NOT NULL DEFAULT 'CA',
  city TEXT NOT NULL DEFAULT 'Fairfield',
  entity_status TEXT NOT NULL DEFAULT 'ACTIVE',
  fiscal_year_end TEXT NOT NULL DEFAULT '12-31',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deadlines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  category TEXT NOT NULL,
  authority TEXT NOT NULL,
  amount_due REAL,
  penalty_per_day REAL,
  penalty_notes TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'upcoming',
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_deadlines_due ON deadlines(due_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deadlines_unique ON deadlines(title, due_date);

CREATE TABLE IF NOT EXISTS qb_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_date TEXT NOT NULL DEFAULT (datetime('now')),
  period_start TEXT,
  period_end TEXT,
  gross_revenue REAL NOT NULL DEFAULT 0,
  total_expenses REAL NOT NULL DEFAULT 0,
  net_profit REAL NOT NULL DEFAULT 0,
  unpaid_invoices_total REAL NOT NULL DEFAULT 0,
  unpaid_invoices_count INTEGER NOT NULL DEFAULT 0,
  ar_over_30 REAL NOT NULL DEFAULT 0,
  raw_summary TEXT
);

CREATE TABLE IF NOT EXISTS deductions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_amount REAL NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL DEFAULT 'medium',
  tax_year INTEGER NOT NULL,
  section TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tax_estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  federal_amount REAL NOT NULL DEFAULT 0,
  ca_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tax_year, quarter)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refund_tracker (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_amount REAL,
  status TEXT NOT NULL DEFAULT 'unchecked',
  action_url TEXT,
  last_checked TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
