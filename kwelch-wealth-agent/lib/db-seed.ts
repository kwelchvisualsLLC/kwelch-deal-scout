import type Database from 'better-sqlite3'

export function seedDatabase(db: Database.Database): void {
  const positionCount = db
    .prepare('SELECT COUNT(*) AS count FROM paper_positions')
    .get() as { count: number }

  if (positionCount.count === 0) {
    const insertPosition = db.prepare(`
      INSERT INTO paper_positions (ticker, shares, entry_price, entry_date, philosophy, conviction, status)
      VALUES (?, ?, ?, ?, ?, ?, 'open')
    `)
    const seedPositions: [string, number, number, string, string, string][] = [
      ['AAPL', 15, 178.2, '2024-11-01', 'Buffett', 'HIGH'],
      ['NVDA', 6, 820.5, '2024-12-15', 'Gates+Musk', 'HIGH'],
      ['BRK.B', 10, 358.0, '2024-10-20', 'Buffett', 'CORE'],
      ['MSFT', 8, 415.3, '2025-01-10', 'Gates', 'HIGH'],
      ['TSLA', 5, 245.0, '2025-02-01', 'Musk', 'SPECULATIVE'],
    ]
    const insertAll = db.transaction(() => {
      for (const p of seedPositions) insertPosition.run(...p)
    })
    insertAll()
  }

  const watchlistCount = db
    .prepare('SELECT COUNT(*) AS count FROM watchlist')
    .get() as { count: number }

  if (watchlistCount.count === 0) {
    const insertTicker = db.prepare(
      'INSERT INTO watchlist (ticker, added_date) VALUES (?, ?)'
    )
    const now = new Date().toISOString()
    const insertAll = db.transaction(() => {
      for (const ticker of ['PLTR', 'OXY', 'KO', 'AMD', 'RTX', 'IYR']) {
        insertTicker.run(ticker, now)
      }
    })
    insertAll()
  }

  const chatCount = db
    .prepare('SELECT COUNT(*) AS count FROM chat_messages')
    .get() as { count: number }

  if (chatCount.count === 0) {
    db.prepare(
      'INSERT INTO chat_messages (role, content, timestamp, session_id) VALUES (?, ?, ?, ?)'
    ).run(
      'assistant',
      "KWELCH WEALTH AGENT online. Portfolio synced. I've analyzed your current 5 positions and have 3 signals ready. Ask me anything — 'analyze my portfolio', 'what would Buffett buy today', or 'run my retirement numbers'. Let's build.",
      new Date().toISOString(),
      'default'
    )
  }
}
