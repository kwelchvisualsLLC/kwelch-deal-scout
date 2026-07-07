import { getAlpacaAccount, getAlpacaPositions, isAlpacaConfigured } from '@/lib/alpaca'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'
import type { Position } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY = 'alpaca:portfolio'

interface PaperRow {
  id: number
  ticker: string
  shares: number
  entry_price: number
  philosophy: string | null
  conviction: string | null
}

function localPositions(): Position[] {
  const rows = getDb()
    .prepare("SELECT id, ticker, shares, entry_price, philosophy, conviction FROM paper_positions WHERE status = 'open' ORDER BY id ASC")
    .all() as PaperRow[]
  return rows.map((row) => ({
    id: row.id,
    ticker: row.ticker,
    shares: row.shares,
    entryPrice: row.entry_price,
    currentPrice: row.entry_price,
    marketValue: row.shares * row.entry_price,
    unrealizedPnl: 0,
    unrealizedPnlPct: 0,
    philosophy: row.philosophy ?? '',
    conviction: row.conviction ?? '',
  }))
}

export async function GET() {
  const db = getDb()

  // Fall back to seeded local positions when Alpaca keys aren't set
  if (!isAlpacaConfigured()) {
    const positions = localPositions()
    const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0)
    return ok({
      live: false,
      account: { equity: totalValue, buyingPower: 0, cash: 0 },
      positions,
    })
  }

  const cached = db
    .prepare('SELECT data, cached_at FROM market_cache WHERE ticker = ?')
    .get(CACHE_KEY) as { data: string; cached_at: string } | undefined
  if (cached && Date.now() - new Date(cached.cached_at).getTime() < CACHE_TTL_MS) {
    return ok(JSON.parse(cached.data))
  }

  try {
    const [account, alpacaPositions] = await Promise.all([getAlpacaAccount(), getAlpacaPositions()])

    const localMeta = new Map(
      (db.prepare("SELECT ticker, philosophy, conviction FROM paper_positions WHERE status = 'open'").all() as {
        ticker: string
        philosophy: string | null
        conviction: string | null
      }[]).map((r) => [r.ticker, r])
    )

    const positions: Position[] = alpacaPositions.map((p, index) => {
      const meta = localMeta.get(p.symbol)
      return {
        id: index + 1,
        ticker: p.symbol,
        shares: Number(p.qty),
        entryPrice: Number(p.avg_entry_price),
        currentPrice: Number(p.current_price),
        marketValue: Number(p.market_value),
        unrealizedPnl: Number(p.unrealized_pl),
        unrealizedPnlPct: Number(p.unrealized_plpc) * 100,
        philosophy: meta?.philosophy ?? '',
        conviction: meta?.conviction ?? '',
      }
    })

    const payload = {
      live: true,
      account: {
        equity: Number(account.equity),
        buyingPower: Number(account.buying_power),
        cash: Number(account.cash),
      },
      positions,
    }

    db.prepare(
      'INSERT INTO market_cache (ticker, data, cached_at) VALUES (?, ?, ?) ON CONFLICT(ticker) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at'
    ).run(CACHE_KEY, JSON.stringify(payload), new Date().toISOString())

    return ok(payload)
  } catch (error) {
    if (cached) return ok(JSON.parse(cached.data))
    const message = error instanceof Error ? error.message : 'Unknown Alpaca error'
    return fail(`Alpaca portfolio fetch failed: ${message}`, 502)
  }
}
