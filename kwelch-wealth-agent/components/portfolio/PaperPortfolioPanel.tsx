'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { StatCard } from '@/components/ui/StatCard'
import { HoldingsTable, type HoldingRowData } from './HoldingsTable'
import { formatCurrency } from '@/lib/utils'
import type { Position } from '@/types'

interface AlpacaPortfolioResponse {
  live: boolean
  account: { equity: number; buyingPower: number; cash: number }
  positions: Position[]
}

export function PaperPortfolioPanel() {
  const [data, setData] = useState<AlpacaPortfolioResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/alpaca/portfolio')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data)
        else setError(json.error || 'Paper portfolio fetch failed')
      })
      .catch(() => setError('Paper portfolio fetch failed.'))
  }, [])

  if (error) {
    return (
      <Card>
        <p className="text-sm font-body text-[#C0392B] py-4">{error}</p>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="flex justify-center py-12">
        <Spinner size="lg" />
      </Card>
    )
  }

  const rows: HoldingRowData[] = data.positions.map((p) => ({
    ticker: p.ticker,
    shares: p.shares,
    avgCost: p.entryPrice,
    currentPrice: p.currentPrice,
    marketValue: p.marketValue,
    pnl: p.unrealizedPnl,
    pnlPct: p.unrealizedPnlPct,
  }))

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#F5F5F5]">
            Paper Portfolio
          </h2>
          {data.live ? <Badge variant="green">Alpaca Live</Badge> : <Badge variant="amber">Local Simulation</Badge>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Equity" value={formatCurrency(data.account.equity)} gold />
          <StatCard label="Buying Power" value={formatCurrency(data.account.buyingPower)} />
          <StatCard label="Cash" value={formatCurrency(data.account.cash)} />
        </div>

        {!data.live && (
          <p className="text-xs font-body text-[#9CA3AF]">
            Alpaca keys not configured — showing seeded local positions at entry price. Add ALPACA_KEY and
            ALPACA_SECRET to .env.local for live paper trading data.
          </p>
        )}

        <HoldingsTable rows={rows} emptyMessage="No open paper positions." />

        <div className="flex justify-end gap-2">
          <Link href="/screener">
            <Button variant="ghost" size="sm">New Paper Trade</Button>
          </Link>
          <Link href="/agent?prompt=Analyze my paper trading portfolio">
            <Button variant="secondary" size="sm">Analyze with AI</Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
