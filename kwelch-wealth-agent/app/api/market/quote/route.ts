import { NextRequest } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'
import type { StockQuote } from '@/types'

const yahooFinance = new YahooFinance()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 60 * 60 * 1000 // 60 minutes

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get('ticker')?.toUpperCase().trim()
  if (!ticker || !/^[A-Z0-9.\-]{1,10}$/.test(ticker)) {
    return fail('A valid ?ticker= parameter is required.', 400)
  }

  const db = getDb()
  const cacheKey = `quote:${ticker}`
  const cached = db
    .prepare('SELECT data, cached_at FROM market_cache WHERE ticker = ?')
    .get(cacheKey) as { data: string; cached_at: string } | undefined

  if (cached && Date.now() - new Date(cached.cached_at).getTime() < CACHE_TTL_MS) {
    return ok(JSON.parse(cached.data) as StockQuote)
  }

  try {
    const q = await yahooFinance.quote(ticker)
    const quote: StockQuote = {
      ticker,
      name: q.shortName || q.longName || ticker,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
      marketCap: q.marketCap ?? 0,
      week52High: q.fiftyTwoWeekHigh ?? 0,
      week52Low: q.fiftyTwoWeekLow ?? 0,
    }

    db.prepare(
      'INSERT INTO market_cache (ticker, data, cached_at) VALUES (?, ?, ?) ON CONFLICT(ticker) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at'
    ).run(cacheKey, JSON.stringify(quote), new Date().toISOString())

    return ok(quote)
  } catch (error) {
    if (cached) return ok(JSON.parse(cached.data) as StockQuote)
    const message = error instanceof Error ? error.message : 'Quote lookup failed'
    return fail(`Could not fetch quote for ${ticker}: ${message}`, 502)
  }
}
