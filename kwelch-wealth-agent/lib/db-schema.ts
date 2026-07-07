import type Database from 'better-sqlite3'

export function initSchema(db: Database.Database): void {
  db.exec(`
    -- Robinhood (Plaid) connection
    CREATE TABLE IF NOT EXISTS plaid_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution TEXT DEFAULT 'Robinhood',
      access_token_encrypted TEXT NOT NULL,
      item_id TEXT NOT NULL,
      connected_at TEXT NOT NULL,
      last_synced TEXT
    );

    -- Robinhood live holdings (synced from Plaid)
    CREATE TABLE IF NOT EXISTS robinhood_holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      name TEXT,
      quantity REAL DEFAULT 0,
      cost_basis REAL DEFAULT 0,
      current_price REAL DEFAULT 0,
      market_value REAL DEFAULT 0,
      unrealized_pnl REAL DEFAULT 0,
      unrealized_pnl_pct REAL DEFAULT 0,
      last_updated TEXT
    );

    -- Robinhood account summary
    CREATE TABLE IF NOT EXISTS robinhood_account (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_value REAL DEFAULT 0,
      buying_power REAL DEFAULT 0,
      total_gain_loss REAL DEFAULT 0,
      total_gain_loss_pct REAL DEFAULT 0,
      last_synced TEXT
    );

    -- Paper trading positions (Alpaca)
    CREATE TABLE IF NOT EXISTS paper_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      shares REAL NOT NULL,
      entry_price REAL NOT NULL,
      entry_date TEXT NOT NULL,
      philosophy TEXT,
      conviction TEXT,
      status TEXT DEFAULT 'open',
      alpaca_order_id TEXT
    );

    -- Paper trade history
    CREATE TABLE IF NOT EXISTS trade_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      action TEXT NOT NULL,
      shares REAL NOT NULL,
      price REAL NOT NULL,
      timestamp TEXT NOT NULL,
      philosophy TEXT,
      alpaca_order_id TEXT,
      notes TEXT,
      pnl REAL
    );

    -- AI agent chat history
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      session_id TEXT DEFAULT 'default'
    );

    -- Watchlist
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT UNIQUE NOT NULL,
      alert_above REAL,
      alert_below REAL,
      added_date TEXT,
      philosophy_signal TEXT,
      conviction TEXT
    );

    -- Life insurance policies
    CREATE TABLE IF NOT EXISTS insurance_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_type TEXT,
      carrier TEXT,
      policy_number_last4 TEXT,
      death_benefit REAL DEFAULT 0,
      cash_value REAL DEFAULT 0,
      surrender_value REAL DEFAULT 0,
      annual_premium REAL DEFAULT 0,
      premium_frequency TEXT DEFAULT 'Monthly',
      policy_start_date TEXT,
      policy_end_date TEXT,
      is_permanent INTEGER DEFAULT 0,
      riders TEXT DEFAULT '[]',
      loan_outstanding REAL DEFAULT 0,
      primary_beneficiary_count INTEGER DEFAULT 0,
      contingent_beneficiary_count INTEGER DEFAULT 0,
      uploaded_at TEXT,
      last_updated TEXT
    );

    -- Retirement snapshots
    CREATE TABLE IF NOT EXISTS retirement_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_age INTEGER,
      current_savings REAL,
      monthly_contribution REAL,
      target_age INTEGER,
      income_need_annual REAL,
      snapshot_date TEXT,
      projection_conservative REAL,
      projection_base REAL,
      projection_optimistic REAL,
      probability_of_success REAL
    );

    -- Market data cache (prevent rate limit hits)
    CREATE TABLE IF NOT EXISTS market_cache (
      ticker TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
  `)
}
