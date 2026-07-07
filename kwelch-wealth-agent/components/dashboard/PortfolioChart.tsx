'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { cn, formatCurrency, formatPct } from '@/lib/utils'

const RANGES = ['1W', '1M', '3M', '1Y', 'ALL'] as const
type Range = (typeof RANGES)[number]

const RANGE_DAYS: Record<Range, number> = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365, ALL: 500 }

// Deterministic pseudo-random walk so the chart is stable across renders
function buildSeries(days: number): { date: string; value: number }[] {
  const points: { date: string; value: number }[] = []
  let value = 9500
  const today = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const seed = Math.sin(i * 12.9898) * 43758.5453
    const noise = (seed - Math.floor(seed) - 0.5) * 120
    value = Math.max(8000, value * 1.0006 + noise)
    points.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value * 100) / 100,
    })
  }
  return points
}

export function PortfolioChart() {
  const [range, setRange] = useState<Range>('3M')
  const data = useMemo(() => buildSeries(RANGE_DAYS[range]), [range])
  const start = data[0]?.value ?? 0

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF]">
          Paper Portfolio Value
        </h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'rounded px-2 py-1 text-[11px] font-mono transition-colors',
                range === r
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                  : 'text-[#9CA3AF] hover:text-[#F5F5F5]'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E1E1E" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => formatCurrency(v, 0)}
              domain={['dataMin - 200', 'dataMax + 200']}
            />
            <Tooltip
              contentStyle={{
                background: '#141414',
                border: '1px solid #C9A84C33',
                borderRadius: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value) => {
                const v = Number(value)
                const pct = start > 0 ? ((v - start) / start) * 100 : 0
                return [`${formatCurrency(v)} (${formatPct(pct)})`, 'Value']
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#C9A84C"
              strokeWidth={2}
              fill="url(#goldFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
