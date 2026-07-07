'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { StatCard } from '@/components/ui/StatCard'
import { cn, formatCurrency, formatPct } from '@/lib/utils'
import type { TradeRecord } from '@/types'

const FILTERS = ['All', 'Buys', 'Sells'] as const
type Filter = (typeof FILTERS)[number]

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')
  const [philosophyFilter, setPhilosophyFilter] = useState<string>('All')

  useEffect(() => {
    fetch('/api/alpaca/history')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTrades(json.data)
        else setError(json.error || 'Failed to load trades')
      })
      .catch(() => setError('Failed to load trades'))
  }, [])

  const philosophies = useMemo(() => {
    const set = new Set<string>()
    trades?.forEach((t) => t.philosophy && set.add(t.philosophy))
    return ['All', ...Array.from(set)]
  }, [trades])

  const filtered = useMemo(() => {
    if (!trades) return []
    return trades.filter((t) => {
      if (filter === 'Buys' && t.action !== 'buy') return false
      if (filter === 'Sells' && t.action !== 'sell') return false
      if (philosophyFilter !== 'All' && t.philosophy !== philosophyFilter) return false
      return true
    })
  }, [trades, filter, philosophyFilter])

  const stats = useMemo(() => {
    const closed = (trades ?? []).filter((t) => t.pnl !== null)
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0)
    const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
    const best = closed.reduce<TradeRecord | null>((acc, t) => ((t.pnl ?? 0) > (acc?.pnl ?? -Infinity) ? t : acc), null)
    const worst = closed.reduce<TradeRecord | null>((acc, t) => ((t.pnl ?? 0) < (acc?.pnl ?? Infinity) ? t : acc), null)
    return {
      total: trades?.length ?? 0,
      winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : null,
      totalPnl,
      best,
      worst,
    }
  }, [trades])

  function exportCsv() {
    if (!trades) return
    const header = 'Date,Ticker,Action,Shares,Price,PnL,Philosophy,OrderID'
    const rows = trades.map((t) =>
      [
        t.timestamp,
        t.ticker,
        t.action.toUpperCase(),
        t.shares,
        t.price,
        t.pnl ?? '',
        t.philosophy ?? '',
        t.alpacaOrderId ?? '',
      ].join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kwelch-trade-history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageWrapper>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Trades" value={String(stats.total)} />
        <StatCard label="Win Rate" value={stats.winRate !== null ? formatPct(stats.winRate).replace('+', '') : '—'} />
        <StatCard label="Total P&L" value={formatCurrency(stats.totalPnl)} gold />
        <StatCard label="Best Trade" value={stats.best ? `${stats.best.ticker} ${formatCurrency(stats.best.pnl ?? 0)}` : '—'} />
        <StatCard label="Worst Trade" value={stats.worst ? `${stats.worst.ticker} ${formatCurrency(stats.worst.pnl ?? 0)}` : '—'} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-mono transition-colors',
                  filter === f ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-[#9CA3AF] hover:text-[#F5F5F5]'
                )}
              >
                {f}
              </button>
            ))}
            <select
              value={philosophyFilter}
              onChange={(e) => setPhilosophyFilter(e.target.value)}
              className="rounded bg-[#1A1A1A] border border-[#1E1E1E] px-2 py-1 text-xs font-mono text-[#9CA3AF] focus:outline-none focus:border-[#C9A84C]/60"
            >
              {philosophies.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'By Philosophy' : p}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" variant="secondary" onClick={exportCsv} disabled={!trades || trades.length === 0}>
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </Button>
        </div>

        {error && <p className="text-sm font-body text-[#C0392B] py-4">{error}</p>}
        {!trades && !error && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}
        {trades && filtered.length === 0 && (
          <p className="py-8 text-center text-sm font-body text-[#9CA3AF]">
            No trades yet — execute a paper trade from the Screener to start the log.
          </p>
        )}

        {filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E1E] text-left text-[10px] font-body uppercase tracking-wider text-[#9CA3AF]">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 px-3">Ticker</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3 text-right">Shares</th>
                  <th className="py-2 px-3 text-right">Price</th>
                  <th className="py-2 px-3 text-right">P&amp;L</th>
                  <th className="py-2 px-3">Philosophy</th>
                  <th className="py-2 pl-3">Order ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trade) => (
                  <tr key={trade.id} className="border-b border-[#1E1E1E]/60 hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-2.5 pr-3 font-mono text-xs text-[#9CA3AF]">
                      {new Date(trade.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-display font-semibold text-[#F5F5F5]">{trade.ticker}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={trade.action === 'buy' ? 'green' : 'red'}>
                        {trade.action.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#F5F5F5]">{trade.shares}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#F5F5F5]">{formatCurrency(trade.price)}</td>
                    <td
                      className={cn(
                        'py-2.5 px-3 text-right font-mono',
                        trade.pnl === null ? 'text-[#9CA3AF]' : trade.pnl >= 0 ? 'text-[#27AE60]' : 'text-[#C0392B]'
                      )}
                    >
                      {trade.pnl !== null ? formatCurrency(trade.pnl) : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-body text-xs text-[#9CA3AF]">{trade.philosophy ?? '—'}</td>
                    <td className="py-2.5 pl-3 font-mono text-[10px] text-[#9CA3AF]">
                      {trade.alpacaOrderId ? `${trade.alpacaOrderId.slice(0, 8)}…` : 'simulated'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
