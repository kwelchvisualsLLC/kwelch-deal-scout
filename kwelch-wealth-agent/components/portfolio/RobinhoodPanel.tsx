'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePlaidLink } from 'react-plaid-link'
import { RefreshCw, Link2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { StatCard } from '@/components/ui/StatCard'
import { HoldingsTable, type HoldingRowData } from './HoldingsTable'
import { formatCurrency } from '@/lib/utils'

interface PortfolioResponse {
  connected: boolean
  stale?: boolean
  holdings: {
    ticker: string
    quantity: number
    cost_basis: number
    current_price: number
    market_value: number
    unrealized_pnl: number
    unrealized_pnl_pct: number
  }[]
  account: {
    total_value: number
    buying_power: number
    total_gain_loss: number
    total_gain_loss_pct: number
    last_synced: string | null
  } | null
}

function PlaidConnectButton({ onConnected }: { onConnected: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/plaid/create-link-token', { method: 'POST' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setLinkToken(json.data.link_token)
        else setError(json.error)
      })
      .catch(() => setError('Could not reach Plaid. Check your API keys.'))
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      const res = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      })
      if (res.ok) onConnected()
    },
  })

  if (error) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-sm font-body text-[#C0392B]">{error}</p>
        <p className="text-xs font-body text-[#9CA3AF]">
          Set PLAID_CLIENT_ID and PLAID_SECRET in .env.local, then restart the dev server.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <p className="text-sm font-body text-[#9CA3AF]">
        Connect your Robinhood account to pull live holdings.
      </p>
      <Button onClick={() => open()} disabled={!ready || !linkToken} loading={!linkToken}>
        <Link2 className="h-4 w-4" />
        Connect Robinhood via Plaid
      </Button>
    </div>
  )
}

export function RobinhoodPanel() {
  const [data, setData] = useState<PortfolioResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/plaid/portfolio')
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error || 'Portfolio fetch failed')
    } catch {
      setError('Portfolio fetch failed — check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rows: HoldingRowData[] =
    data?.holdings.map((h) => ({
      ticker: h.ticker,
      shares: h.quantity,
      avgCost: h.cost_basis,
      currentPrice: h.current_price,
      marketValue: h.market_value,
      pnl: h.unrealized_pnl,
      pnlPct: h.unrealized_pnl_pct,
    })) ?? []

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#F5F5F5]">
            Robinhood — Live Portfolio
          </h2>
          {data?.connected ? (
            <Badge variant="green">Connected</Badge>
          ) : (
            <Badge variant="gray">Not Connected</Badge>
          )}
          {data?.stale && <Badge variant="amber">Stale data</Badge>}
        </div>
        {data?.connected && (
          <Button size="sm" variant="secondary" onClick={load} loading={loading}>
            {!loading && <RefreshCw className="h-3.5 w-3.5" />}
            Sync
          </Button>
        )}
      </div>

      {loading && !data && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && <p className="text-sm font-body text-[#C0392B] py-4">{error}</p>}

      {data && !data.connected && <PlaidConnectButton onConnected={load} />}

      {data?.connected && (
        <div className="space-y-4">
          {data.account && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Total Value" value={formatCurrency(data.account.total_value)} gold />
              <StatCard label="Buying Power" value={formatCurrency(data.account.buying_power)} />
              <StatCard
                label="Total Gain/Loss"
                value={formatCurrency(data.account.total_gain_loss)}
                changePct={data.account.total_gain_loss_pct}
              />
            </div>
          )}
          <HoldingsTable rows={rows} emptyMessage="No holdings synced yet — hit Sync." />
          <div className="flex justify-end">
            <Link href="/agent?prompt=Analyze my Robinhood portfolio">
              <Button variant="secondary" size="sm">Analyze with AI</Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}
