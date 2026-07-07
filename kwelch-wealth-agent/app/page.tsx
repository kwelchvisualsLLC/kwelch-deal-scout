'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { NetWorthSummary } from '@/components/dashboard/NetWorthSummary'
import { PortfolioChart } from '@/components/dashboard/PortfolioChart'
import { SignalFeed } from '@/components/dashboard/SignalFeed'
import { RetirementTracker } from '@/components/dashboard/RetirementTracker'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { HoldingsTable, type HoldingRowData } from '@/components/portfolio/HoldingsTable'
import type { NetWorth } from '@/types'

export default function DashboardPage() {
  const [total, setTotal] = useState(0)
  const [topHoldings, setTopHoldings] = useState<HoldingRowData[] | null>(null)

  useEffect(() => {
    fetch('/api/networth')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTotal((json.data as NetWorth).total)
      })
      .catch(() => undefined)

    fetch('/api/plaid/portfolio')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.holdings) {
          const rows = (json.data.holdings as {
            ticker: string
            quantity: number
            cost_basis: number
            current_price: number
            market_value: number
            unrealized_pnl: number
            unrealized_pnl_pct: number
          }[])
            .slice(0, 3)
            .map((h) => ({
              ticker: h.ticker,
              shares: h.quantity,
              avgCost: h.cost_basis,
              currentPrice: h.current_price,
              marketValue: h.market_value,
              pnl: h.unrealized_pnl,
              pnlPct: h.unrealized_pnl_pct,
            }))
          setTopHoldings(rows)
        } else {
          setTopHoldings([])
        }
      })
      .catch(() => setTopHoldings([]))
  }, [])

  return (
    <PageWrapper>
      <NetWorthSummary />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PortfolioChart />
        </div>
        <div className="lg:col-span-4">
          <RetirementTracker currentTotal={total} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SignalFeed />
        <Card>
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
            Top Robinhood Positions
          </h2>
          {topHoldings === null ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <HoldingsTable
              rows={topHoldings}
              emptyMessage="Connect Robinhood on the Portfolio page to see live positions."
            />
          )}
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-body text-[#9CA3AF]">Quick actions</span>
          <div className="flex flex-wrap gap-2">
            <Link href="/agent?prompt=Run a full AI analysis of my finances">
              <Button size="sm">Run AI Analysis</Button>
            </Link>
            <Link href="/screener">
              <Button size="sm" variant="secondary">Add to Watchlist</Button>
            </Link>
            <Link href="/screener">
              <Button size="sm" variant="secondary">New Paper Trade</Button>
            </Link>
          </div>
        </div>
      </Card>
    </PageWrapper>
  )
}
