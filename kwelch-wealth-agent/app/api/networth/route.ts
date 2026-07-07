import { getDb } from '@/lib/db'
import { ok } from '@/lib/api-helpers'
import type { NetWorth } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RETIREMENT_GOAL = 3_000_000 // 4% rule on ~$120K/yr retirement income

export async function GET() {
  const db = getDb()

  const robinhood = db
    .prepare('SELECT COALESCE(SUM(market_value), 0) AS total FROM robinhood_holdings')
    .get() as { total: number }

  const connected = Boolean(
    db.prepare('SELECT id FROM plaid_connections LIMIT 1').get()
  )

  const paper = db
    .prepare("SELECT COALESCE(SUM(shares * entry_price), 0) AS total FROM paper_positions WHERE status = 'open'")
    .get() as { total: number }

  const insurance = db
    .prepare('SELECT COALESCE(SUM(cash_value), 0) AS total FROM insurance_policies')
    .get() as { total: number }

  const total = robinhood.total + paper.total + insurance.total
  const netWorth: NetWorth & { robinhoodConnected: boolean } = {
    robinhoodValue: robinhood.total,
    paperPortfolioValue: paper.total,
    insuranceCashValue: insurance.total,
    total,
    retirementGoal: RETIREMENT_GOAL,
    retirementGap: total - RETIREMENT_GOAL,
    robinhoodConnected: connected,
  }

  return ok(netWorth)
}
