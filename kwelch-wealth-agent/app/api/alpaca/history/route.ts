import { getDb } from '@/lib/db'
import { ok } from '@/lib/api-helpers'
import type { TradeRecord } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TradeRow {
  id: number
  ticker: string
  action: 'buy' | 'sell'
  shares: number
  price: number
  timestamp: string
  philosophy: string | null
  alpaca_order_id: string | null
  notes: string | null
  pnl: number | null
}

export async function GET() {
  const rows = getDb()
    .prepare('SELECT * FROM trade_history ORDER BY timestamp DESC LIMIT 500')
    .all() as TradeRow[]

  const trades: TradeRecord[] = rows.map((row) => ({
    id: row.id,
    ticker: row.ticker,
    action: row.action,
    shares: row.shares,
    price: row.price,
    timestamp: row.timestamp,
    philosophy: row.philosophy,
    alpacaOrderId: row.alpaca_order_id,
    notes: row.notes,
    pnl: row.pnl,
  }))

  return ok(trades)
}
