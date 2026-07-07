import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PaperRow {
  id: number
  ticker: string
  shares: number
  entry_price: number
  entry_date: string
  philosophy: string | null
  conviction: string | null
  status: string
}

export async function GET() {
  const rows = getDb()
    .prepare("SELECT * FROM paper_positions WHERE status = 'open' ORDER BY id ASC")
    .all() as PaperRow[]

  return ok(
    rows.map((row) => ({
      id: row.id,
      ticker: row.ticker,
      shares: row.shares,
      entryPrice: row.entry_price,
      entryDate: row.entry_date,
      philosophy: row.philosophy,
      conviction: row.conviction,
    }))
  )
}

export async function POST(request: NextRequest) {
  let body: {
    ticker?: string
    shares?: number
    entryPrice?: number
    philosophy?: string
    conviction?: string
  }
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }

  const ticker = body.ticker?.toUpperCase().trim()
  const shares = Number(body.shares)
  const entryPrice = Number(body.entryPrice)

  if (!ticker || !/^[A-Z0-9.\-]{1,10}$/.test(ticker)) return fail('A valid ticker is required.', 400)
  if (!Number.isFinite(shares) || shares <= 0) return fail('shares must be positive.', 400)
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) return fail('entryPrice must be positive.', 400)

  const result = getDb()
    .prepare(
      "INSERT INTO paper_positions (ticker, shares, entry_price, entry_date, philosophy, conviction, status) VALUES (?, ?, ?, ?, ?, ?, 'open')"
    )
    .run(
      ticker,
      shares,
      entryPrice,
      new Date().toISOString().slice(0, 10),
      body.philosophy ?? null,
      body.conviction ?? null
    )

  return ok({ id: Number(result.lastInsertRowid), ticker }, 201)
}
