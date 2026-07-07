import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'
import type { WatchlistItem } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface WatchlistRow {
  id: number
  ticker: string
  alert_above: number | null
  alert_below: number | null
  added_date: string | null
  philosophy_signal: string | null
  conviction: string | null
}

export async function GET() {
  const rows = getDb()
    .prepare('SELECT * FROM watchlist ORDER BY id ASC')
    .all() as WatchlistRow[]

  const items: WatchlistItem[] = rows.map((row) => ({
    id: row.id,
    ticker: row.ticker,
    alertAbove: row.alert_above,
    alertBelow: row.alert_below,
    addedDate: row.added_date,
    philosophySignal: row.philosophy_signal,
    conviction: row.conviction,
  }))

  return ok(items)
}

export async function POST(request: NextRequest) {
  let body: { ticker?: string; alertAbove?: number; alertBelow?: number }
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }

  const ticker = body.ticker?.toUpperCase().trim()
  if (!ticker || !/^[A-Z0-9.\-]{1,10}$/.test(ticker)) {
    return fail('A valid ticker is required.', 400)
  }

  try {
    const result = getDb()
      .prepare('INSERT INTO watchlist (ticker, alert_above, alert_below, added_date) VALUES (?, ?, ?, ?)')
      .run(ticker, body.alertAbove ?? null, body.alertBelow ?? null, new Date().toISOString())
    return ok({ id: Number(result.lastInsertRowid), ticker }, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return fail(`${ticker} is already on the watchlist.`, 409)
    }
    throw error
  }
}
