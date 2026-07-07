import { NextRequest } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'
import type { StockQuote } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const yahooFinance = new YahooFinance()

const CACHE_TTL_MS = 60 * 60 * 1000 // 60 minutes

// Source 1: yahoo-finance2 library (full data, but depends on Yahoo's
// cookie/crumb handshake, which Yahoo breaks from time to time)
async function fromYahooLib(ticker: string): Promise<StockQuote> {
  const q = await yahooFinance.quote(ticker)
  return {
    ticker,
    name: q.shortName || q.longName || ticker,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePct: q.regularMarketChangePercent ?? 0,
    marketCap: q.marketCap ?? 0,
    week52High: q.fiftyTwoWeekHigh ?? 0,
    week52Low: q.fiftyTwoWeekLow ?? 0,
  }
}

// Source 2: Yahoo's chart endpoint — no crumb/cookie required, so it keeps
// working when the handshake above fails. No market cap in this payload.
async function fromYahooChart(ticker: string): Promise<StockQuote> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`,
    { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } }
  )
  if (!res.ok) throw new Error(`Yahoo chart endpoint responded ${res.status}`)
  const json = (await res.json()) as {
    chart?: { result?: { meta?: Record<string, unknown> }[]; error?: { description?: string } }
  }
  const meta = json.chart?.result?.[0]?.meta
  if (!meta) throw new Error(json.chart?.error?.description || 'No chart data returned')

  const price = Number(meta.regularMarketPrice) || 0
  const prevClose = Number(meta.chartPreviousClose ?? meta.previousClose) || 0
  const change = prevClose > 0 ? price - prevClose : 0
  return {
    ticker,
    name: String(meta.shortName || meta.longName || ticker),
    price,
    change,
    changePct: prevClose > 0 ? (change / prevClose) * 100 : 0,
    marketCap: 0,
    week52High: Number(meta.fiftyTwoWeekHigh) || 0,
    week52Low: Number(meta.fiftyTwoWeekLow) || 0,
  }
}

// Source 3: Alpha Vantage GLOBAL_QUOTE (works when the user has a key)
async function fromAlphaVantage(ticker: string): Promise<StockQuote> {
  const key = process.env.ALPHA_VANTAGE_KEY
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not configured')
  const res = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${key}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`Alpha Vantage responded ${res.status}`)
  const json = (await res.json()) as { 'Global Quote'?: Record<string, string>; Note?: string; Information?: string }
  if (json.Note || json.Information) throw new Error('Alpha Vantage rate limit reached')
  const g = json['Global Quote']
  const price = Number(g?.['05. price'])
  if (!g || !Number.isFinite(price) || price <= 0) throw new Error('No quote data from Alpha Vantage')
  return {
    ticker,
    name: ticker,
    price,
    change: Number(g['09. change']) || 0,
    changePct: Number((g['10. change percent'] || '0').replace('%', '')) || 0,
    marketCap: 0,
    week52High: 0,
    week52Low: 0,
  }
}

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

  const errors: string[] = []
  for (const source of [fromYahooLib, fromYahooChart, fromAlphaVantage]) {
    try {
      const quote = await source(ticker)
      if (quote.price > 0) {
        db.prepare(
          'INSERT INTO market_cache (ticker, data, cached_at) VALUES (?, ?, ?) ON CONFLICT(ticker) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at'
        ).run(cacheKey, JSON.stringify(quote), new Date().toISOString())
        return ok(quote)
      }
      errors.push(`${source.name}: returned no price`)
    } catch (error) {
      errors.push(`${source.name}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }

  // Every live source failed — serve stale cache if we have one
  if (cached) return ok(JSON.parse(cached.data) as StockQuote)
  return fail(`Could not fetch quote for ${ticker} — ${errors.join(' | ')}`, 502)
}
