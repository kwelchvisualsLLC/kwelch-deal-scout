import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'
import type { Fundamentals } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours — fundamentals move slowly

function num(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get('ticker')?.toUpperCase().trim()
  if (!ticker || !/^[A-Z0-9.\-]{1,10}$/.test(ticker)) {
    return fail('A valid ?ticker= parameter is required.', 400)
  }
  if (!process.env.ALPHA_VANTAGE_KEY) {
    return fail('ALPHA_VANTAGE_KEY is not configured. Add it to .env.local.', 500)
  }

  const db = getDb()
  const cacheKey = `fundamentals:${ticker}`
  const cached = db
    .prepare('SELECT data, cached_at FROM market_cache WHERE ticker = ?')
    .get(cacheKey) as { data: string; cached_at: string } | undefined

  if (cached && Date.now() - new Date(cached.cached_at).getTime() < CACHE_TTL_MS) {
    return ok(JSON.parse(cached.data) as Fundamentals)
  }

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${process.env.ALPHA_VANTAGE_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Alpha Vantage responded ${res.status}`)
    const raw = (await res.json()) as Record<string, string>

    if (raw.Note || raw.Information) {
      // Rate limited — serve stale cache if we have it
      if (cached) return ok(JSON.parse(cached.data) as Fundamentals)
      return fail('Alpha Vantage rate limit reached. Try again in a minute.', 429)
    }

    const fundamentals: Fundamentals = {
      ticker,
      pe: num(raw.PERatio),
      eps: num(raw.EPS),
      dividendYield: num(raw.DividendYield),
      priceToBook: num(raw.PriceToBookRatio),
      roe: num(raw.ReturnOnEquityTTM),
      debtToEquity: num(raw.DebtToEquityRatio),
      freeCashFlow: num(raw.FreeCashflow),
      forwardPE: num(raw.ForwardPE),
    }

    db.prepare(
      'INSERT INTO market_cache (ticker, data, cached_at) VALUES (?, ?, ?) ON CONFLICT(ticker) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at'
    ).run(cacheKey, JSON.stringify(fundamentals), new Date().toISOString())

    return ok(fundamentals)
  } catch (error) {
    if (cached) return ok(JSON.parse(cached.data) as Fundamentals)
    const message = error instanceof Error ? error.message : 'Fundamentals lookup failed'
    return fail(`Could not fetch fundamentals for ${ticker}: ${message}`, 502)
  }
}
