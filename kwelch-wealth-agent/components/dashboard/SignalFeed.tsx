'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { SignalBadge } from '@/components/screener/SignalBadge'
import { formatCurrency } from '@/lib/utils'
import type { WatchlistItem, StockQuote } from '@/types'

const PHILOSOPHER_DOTS: { name: string; color: string }[] = [
  { name: 'Buffett', color: '#C9A84C' },
  { name: 'Gates', color: '#3B82F6' },
  { name: 'Musk', color: '#9CA3AF' },
  { name: 'Trump', color: '#C0392B' },
]

interface FeedRow {
  ticker: string
  price: number | null
  signal: 'BUY' | 'HOLD' | 'SELL' | 'WATCH'
  confidence: number
  agree: number[]
}

// Deterministic placeholder signal per ticker until the agent generates fresh ones
function derivedSignal(ticker: string): { signal: FeedRow['signal']; confidence: number; agree: number[] } {
  const hash = ticker.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)
  const signals: FeedRow['signal'][] = ['BUY', 'WATCH', 'HOLD', 'BUY']
  const signal = signals[hash % signals.length]
  const confidence = 55 + (hash % 40)
  const agree = PHILOSOPHER_DOTS.map((_, i) => i).filter((i) => (hash >> i) % 2 === 0)
  return { signal, confidence, agree: agree.length ? agree : [0] }
}

export function SignalFeed() {
  const [rows, setRows] = useState<FeedRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/watchlist')
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        const items = (json.data as WatchlistItem[]).slice(0, 5)

        const withQuotes = await Promise.all(
          items.map(async (item) => {
            let price: number | null = null
            try {
              const qRes = await fetch(`/api/market/quote?ticker=${item.ticker}`)
              const qJson = await qRes.json()
              if (qJson.success) price = (qJson.data as StockQuote).price
            } catch {
              price = null
            }
            return { ticker: item.ticker, price, ...derivedSignal(item.ticker) }
          })
        )
        setRows(withQuotes)
      } catch {
        setError('Could not load watchlist signals.')
      }
    }
    load()
  }, [])

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF]">
          Signal Feed
        </h2>
        <Link href="/agent?prompt=Generate fresh signals for my watchlist">
          <Button size="sm" variant="secondary">Generate Signals</Button>
        </Link>
      </div>

      {error && <p className="text-sm font-body text-[#C0392B]">{error}</p>}
      {!rows && !error && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {rows && rows.length === 0 && (
        <p className="text-sm font-body text-[#9CA3AF]">
          Watchlist is empty — add tickers from the <Link href="/screener" className="text-[#C9A84C] underline">Screener</Link>.
        </p>
      )}

      <div className="space-y-1">
        {rows?.map((row) => (
          <div
            key={row.ticker}
            className="flex items-center justify-between rounded px-2 py-2 hover:bg-[#1A1A1A] transition-colors"
          >
            <span className="font-display text-sm font-semibold text-[#F5F5F5] w-16">{row.ticker}</span>
            <span className="font-mono text-xs text-[#9CA3AF] w-24 text-right">
              {row.price !== null ? formatCurrency(row.price) : '—'}
            </span>
            <SignalBadge signal={row.signal} confidence={row.confidence} />
            <span className="flex gap-1 w-16 justify-end">
              {row.agree.map((i) => (
                <span
                  key={i}
                  title={PHILOSOPHER_DOTS[i].name}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PHILOSOPHER_DOTS[i].color }}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
