import { getPlaidClient, isPlaidConfigured } from '@/lib/plaid'
import { getDb } from '@/lib/db'
import { decrypt } from '@/lib/encryption'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYNC_TTL_MS = 30 * 60 * 1000 // 30 minutes

interface HoldingRow {
  ticker: string
  name: string | null
  quantity: number
  cost_basis: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  last_updated: string | null
}

function readHoldings() {
  const db = getDb()
  const holdings = db
    .prepare('SELECT ticker, name, quantity, cost_basis, current_price, market_value, unrealized_pnl, unrealized_pnl_pct, last_updated FROM robinhood_holdings ORDER BY market_value DESC')
    .all() as HoldingRow[]
  const account = db
    .prepare('SELECT total_value, buying_power, total_gain_loss, total_gain_loss_pct, last_synced FROM robinhood_account ORDER BY id DESC LIMIT 1')
    .get() as
    | { total_value: number; buying_power: number; total_gain_loss: number; total_gain_loss_pct: number; last_synced: string | null }
    | undefined
  return { holdings, account: account ?? null }
}

export async function GET() {
  const db = getDb()
  const connection = db
    .prepare('SELECT access_token_encrypted, last_synced FROM plaid_connections ORDER BY id DESC LIMIT 1')
    .get() as { access_token_encrypted: string; last_synced: string | null } | undefined

  if (!connection) {
    return ok({ connected: false, holdings: [], account: null })
  }

  // Serve cached holdings when synced recently
  if (connection.last_synced && Date.now() - new Date(connection.last_synced).getTime() < SYNC_TTL_MS) {
    return ok({ connected: true, ...readHoldings() })
  }

  if (!isPlaidConfigured()) {
    return fail('Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in .env.local.', 500)
  }

  try {
    const accessToken = decrypt(connection.access_token_encrypted)
    const response = await getPlaidClient().investmentsHoldingsGet({ access_token: accessToken })
    const { holdings, securities, accounts } = response.data

    const securityById = new Map(securities.map((s) => [s.security_id, s]))
    const now = new Date().toISOString()

    const sync = db.transaction(() => {
      db.prepare('DELETE FROM robinhood_holdings').run()
      const insert = db.prepare(`
        INSERT INTO robinhood_holdings (ticker, name, quantity, cost_basis, current_price, market_value, unrealized_pnl, unrealized_pnl_pct, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const holding of holdings) {
        const security = securityById.get(holding.security_id)
        const ticker = security?.ticker_symbol || security?.name || 'UNKNOWN'
        const quantity = holding.quantity ?? 0
        const costBasis = holding.cost_basis ?? 0
        const price = holding.institution_price ?? security?.close_price ?? 0
        const marketValue = holding.institution_value ?? quantity * price
        const pnl = marketValue - costBasis * quantity
        const pnlPct = costBasis > 0 ? ((price - costBasis) / costBasis) * 100 : 0
        insert.run(ticker, security?.name ?? null, quantity, costBasis, price, marketValue, pnl, pnlPct, now)
      }

      const totalValue = accounts.reduce((sum, a) => sum + (a.balances.current ?? 0), 0)
      const buyingPower = accounts.reduce((sum, a) => sum + (a.balances.available ?? 0), 0)
      const totalCostBasis = holdings.reduce((sum, h) => sum + (h.cost_basis ?? 0) * (h.quantity ?? 0), 0)
      const totalMarketValue = holdings.reduce((sum, h) => sum + (h.institution_value ?? 0), 0)
      const totalGainLoss = totalMarketValue - totalCostBasis
      const totalGainLossPct = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0

      db.prepare('DELETE FROM robinhood_account').run()
      db.prepare(
        'INSERT INTO robinhood_account (total_value, buying_power, total_gain_loss, total_gain_loss_pct, last_synced) VALUES (?, ?, ?, ?, ?)'
      ).run(totalValue, buyingPower, totalGainLoss, totalGainLossPct, now)

      db.prepare('UPDATE plaid_connections SET last_synced = ?').run(now)
    })
    sync()

    return ok({ connected: true, ...readHoldings() })
  } catch (error) {
    // Fall back to whatever we have cached rather than blanking the UI
    const cached = readHoldings()
    if (cached.holdings.length > 0) {
      return ok({ connected: true, stale: true, ...cached })
    }
    const message = error instanceof Error ? error.message : 'Unknown Plaid error'
    return fail(`Portfolio sync failed: ${message}`, 502)
  }
}
