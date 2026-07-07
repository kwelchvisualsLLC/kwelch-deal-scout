'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TickerSearch } from '@/components/screener/TickerSearch'
import { PhilosophySelector, type Philosopher } from '@/components/screener/PhilosophySelector'
import { PhilosophyCard } from '@/components/screener/PhilosophyCard'
import { SignalBadge } from '@/components/screener/SignalBadge'
import { WatchlistButton } from '@/components/screener/WatchlistButton'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatLargeNumber, formatPct } from '@/lib/utils'
import type { Fundamentals, PhilosophySignal, StockQuote } from '@/types'

const ALL_PHILOSOPHERS: Philosopher[] = ['Buffett', 'Gates', 'Musk', 'Trump']

interface Analysis {
  quote: StockQuote
  fundamentals: Fundamentals | null
  signals: PhilosophySignal[]
  overall: { signal: 'BUY' | 'HOLD' | 'SELL' | 'WATCH'; confidence: number }
}

// Rule-based philosopher verdicts from fundamentals — instant screening
// before asking the AI agent for a deep dive.
function buildSignals(quote: StockQuote, f: Fundamentals | null): PhilosophySignal[] {
  const pe = f?.pe ?? null
  const roe = f?.roe ?? null
  const debt = f?.debtToEquity ?? null
  const nearHigh = quote.week52High > 0 ? quote.price / quote.week52High : 0

  const buffett: PhilosophySignal = {
    philosopher: 'Buffett',
    verdict: pe !== null && pe > 0 && pe < 25 && (roe === null || roe > 0.12) ? 'YES' : pe !== null && pe > 40 ? 'NO' : 'WAIT',
    reasoning:
      pe === null
        ? 'Insufficient earnings data — a business you cannot value is a business you do not buy.'
        : pe < 25
          ? `Reasonable ${pe.toFixed(1)}x earnings multiple with acceptable returns on equity.`
          : `At ${pe.toFixed(1)}x earnings the margin of safety is gone.`,
    color: '#C9A84C',
  }

  const gates: PhilosophySignal = {
    philosopher: 'Gates',
    verdict: quote.marketCap > 200e9 ? 'YES' : quote.marketCap > 20e9 ? 'WAIT' : 'NO',
    reasoning:
      quote.marketCap > 200e9
        ? 'Platform-scale business with the balance sheet to fund a durable technology moat.'
        : 'Needs proof its infrastructure becomes unavoidable — watch enterprise traction.',
    color: '#3B82F6',
  }

  const musk: PhilosophySignal = {
    philosopher: 'Musk',
    verdict: nearHigh > 0.85 ? 'YES' : nearHigh > 0.6 ? 'WAIT' : 'NO',
    reasoning:
      nearHigh > 0.85
        ? 'Momentum near 52-week highs — the market is pricing a step-change, not incrementalism.'
        : 'No asymmetric-upside setup visible; revisit if the mission or cost curve changes.',
    color: '#9CA3AF',
  }

  const trump: PhilosophySignal = {
    philosopher: 'Trump',
    verdict: debt !== null && debt < 1.5 && (f?.priceToBook ?? 99) < 10 ? 'YES' : 'WAIT',
    reasoning:
      debt !== null && debt < 1.5
        ? 'Real assets, manageable leverage — a deal an outsider can understand.'
        : 'Leverage or asset backing unclear — a great brand still needs hard assets behind it.',
    color: '#C0392B',
  }

  return [buffett, gates, musk, trump]
}

function overallSignal(signals: PhilosophySignal[]): Analysis['overall'] {
  const yes = signals.filter((s) => s.verdict === 'YES').length
  const no = signals.filter((s) => s.verdict === 'NO').length
  if (yes >= 3) return { signal: 'BUY', confidence: 60 + yes * 8 }
  if (no >= 3) return { signal: 'SELL', confidence: 55 + no * 8 }
  if (yes === 2) return { signal: 'WATCH', confidence: 65 }
  return { signal: 'HOLD', confidence: 55 }
}

export default function ScreenerPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Philosopher[]>(ALL_PHILOSOPHERS)

  async function analyze(ticker: string) {
    setLoading(true)
    setError(null)
    try {
      const quoteRes = await fetch(`/api/market/quote?ticker=${ticker}`)
      const quoteJson = await quoteRes.json()
      if (!quoteJson.success) throw new Error(quoteJson.error || 'Quote lookup failed')
      const quote = quoteJson.data as StockQuote

      let fundamentals: Fundamentals | null = null
      try {
        const fRes = await fetch(`/api/market/fundamentals?ticker=${ticker}`)
        const fJson = await fRes.json()
        if (fJson.success) fundamentals = fJson.data as Fundamentals
      } catch {
        fundamentals = null
      }

      const signals = buildSignals(quote, fundamentals)
      setAnalysis({ quote, fundamentals, signals, overall: overallSignal(signals) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  function toggle(philosopher: Philosopher) {
    setSelected((prev) =>
      prev.includes(philosopher) ? prev.filter((p) => p !== philosopher) : [...prev, philosopher]
    )
  }

  const visibleSignals = analysis?.signals.filter((s) => selected.includes(s.philosopher as Philosopher)) ?? []

  return (
    <PageWrapper>
      <Card>
        <div className="space-y-4">
          <TickerSearch onSearch={analyze} loading={loading} />
          <PhilosophySelector selected={selected} onToggle={toggle} />
        </div>
      </Card>

      {error && (
        <Card>
          <p className="text-sm font-body text-[#C0392B]">{error}</p>
        </Card>
      )}

      {analysis && (
        <>
          <Card gold>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F5F5F5]">
                  {analysis.quote.ticker}
                  <span className="ml-3 text-sm font-body font-normal text-[#9CA3AF]">
                    {analysis.quote.name}
                  </span>
                </h2>
                <p className="font-mono text-sm mt-1">
                  <span className="text-[#F5F5F5]">{formatCurrency(analysis.quote.price)}</span>{' '}
                  <span className={analysis.quote.changePct >= 0 ? 'text-[#27AE60]' : 'text-[#C0392B]'}>
                    {formatPct(analysis.quote.changePct)}
                  </span>
                  <span className="text-[#9CA3AF]">
                    {' '}· MCap {formatLargeNumber(analysis.quote.marketCap)} · 52W{' '}
                    {formatCurrency(analysis.quote.week52Low)}–{formatCurrency(analysis.quote.week52High)}
                  </span>
                </p>
              </div>
              <SignalBadge signal={analysis.overall.signal} confidence={analysis.overall.confidence} />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {visibleSignals.map((signal) => (
              <PhilosophyCard
                key={signal.philosopher}
                signal={signal}
                metrics={
                  analysis.fundamentals
                    ? `P/E: ${analysis.fundamentals.pe?.toFixed(1) ?? '—'} | ROE: ${
                        analysis.fundamentals.roe !== null
                          ? (analysis.fundamentals.roe * 100).toFixed(0) + '%'
                          : '—'
                      } | D/E: ${analysis.fundamentals.debtToEquity?.toFixed(2) ?? '—'}`
                    : undefined
                }
              />
            ))}
          </div>

          <Card>
            <div className="flex flex-wrap gap-2 justify-end">
              <WatchlistButton ticker={analysis.quote.ticker} />
              <Link href={`/agent?prompt=Execute a paper trade recommendation for ${analysis.quote.ticker}`}>
                <Button variant="secondary" size="sm">Execute Paper Trade</Button>
              </Link>
              <Link href={`/agent?prompt=Deep dive analysis on ${analysis.quote.ticker} through all four philosophies`}>
                <Button size="sm">Ask AI for Deep Dive</Button>
              </Link>
            </div>
          </Card>
        </>
      )}

      {!analysis && !error && !loading && (
        <Card>
          <p className="text-center text-sm font-body text-[#9CA3AF] py-8">
            Enter a ticker or pick one of the pre-loaded names to run it through all four investment
            philosophies.
          </p>
        </Card>
      )}
    </PageWrapper>
  )
}
