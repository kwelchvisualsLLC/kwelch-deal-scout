import { NextRequest } from 'next/server'
import { submitAlpacaOrder, isAlpacaConfigured } from '@/lib/alpaca'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'

interface TradeBody {
  action?: 'buy' | 'sell'
  ticker?: string
  shares?: number
  philosophy?: string
}

export async function POST(request: NextRequest) {
  let body: TradeBody
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }

  const action = body.action
  const ticker = body.ticker?.toUpperCase().trim()
  const shares = Number(body.shares)
  const philosophy = body.philosophy?.trim() || null

  if (action !== 'buy' && action !== 'sell') return fail("action must be 'buy' or 'sell'.", 400)
  if (!ticker || !/^[A-Z0-9.\-]{1,10}$/.test(ticker)) return fail('A valid ticker is required.', 400)
  if (!Number.isFinite(shares) || shares <= 0) return fail('shares must be a positive number.', 400)

  const db = getDb()
  const now = new Date().toISOString()

  let orderId: string | null = null
  let executedPrice = 0

  if (isAlpacaConfigured()) {
    try {
      const order = await submitAlpacaOrder({ symbol: ticker, qty: shares, side: action })
      orderId = order.id
      executedPrice = Number(order.filled_avg_price) || 0
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Alpaca error'
      return fail(`Alpaca order failed: ${message}`, 502)
    }
  }

  // Fill in a reference price from cache if the market order hasn't filled yet
  if (executedPrice === 0) {
    const cached = db
      .prepare('SELECT data FROM market_cache WHERE ticker = ?')
      .get(`quote:${ticker}`) as { data: string } | undefined
    if (cached) {
      try {
        executedPrice = (JSON.parse(cached.data) as { price?: number }).price ?? 0
      } catch {
        executedPrice = 0
      }
    }
  }

  let pnl: number | null = null

  const record = db.transaction(() => {
    if (action === 'buy') {
      const existing = db
        .prepare("SELECT id, shares, entry_price FROM paper_positions WHERE ticker = ? AND status = 'open'")
        .get(ticker) as { id: number; shares: number; entry_price: number } | undefined
      if (existing) {
        const totalShares = existing.shares + shares
        const blendedEntry =
          (existing.shares * existing.entry_price + shares * executedPrice) / totalShares
        db.prepare('UPDATE paper_positions SET shares = ?, entry_price = ?, alpaca_order_id = ? WHERE id = ?').run(
          totalShares,
          blendedEntry,
          orderId,
          existing.id
        )
      } else {
        db.prepare(
          "INSERT INTO paper_positions (ticker, shares, entry_price, entry_date, philosophy, conviction, status, alpaca_order_id) VALUES (?, ?, ?, ?, ?, 'MEDIUM', 'open', ?)"
        ).run(ticker, shares, executedPrice, now.slice(0, 10), philosophy, orderId)
      }
    } else {
      const existing = db
        .prepare("SELECT id, shares, entry_price FROM paper_positions WHERE ticker = ? AND status = 'open'")
        .get(ticker) as { id: number; shares: number; entry_price: number } | undefined
      if (existing) {
        pnl = (executedPrice - existing.entry_price) * Math.min(shares, existing.shares)
        const remaining = existing.shares - shares
        if (remaining > 0.0001) {
          db.prepare('UPDATE paper_positions SET shares = ? WHERE id = ?').run(remaining, existing.id)
        } else {
          db.prepare("UPDATE paper_positions SET status = 'closed', shares = 0 WHERE id = ?").run(existing.id)
        }
      }
    }

    db.prepare(
      'INSERT INTO trade_history (ticker, action, shares, price, timestamp, philosophy, alpaca_order_id, pnl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(ticker, action, shares, executedPrice, now, philosophy, orderId, pnl)
  })
  record()

  return ok({
    order_id: orderId,
    executed_price: executedPrice,
    simulated: !isAlpacaConfigured(),
  })
}
