'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { formatLargeNumber, formatCurrency } from '@/lib/utils'
import type { MonteCarloYearPoint } from '@/types'

interface MonteCarloChartProps {
  data: MonteCarloYearPoint[]
  goal: number
}

export function MonteCarloChart({ data, goal }: MonteCarloChartProps) {
  return (
    <Card>
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">
        Projection by Age
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="mcOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#27AE60" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#27AE60" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="mcBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="mcConservative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F39C12" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#F39C12" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E1E1E" vertical={false} />
            <XAxis dataKey="year" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => formatLargeNumber(v)}
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
              labelFormatter={(label) => `Age ${label} · goal ${formatCurrency(goal, 0)}`}
              formatter={(value, name) => [formatCurrency(Number(value), 0), String(name)]}
            />
            <Area type="monotone" dataKey="optimistic" name="Optimistic (90th)" stroke="#27AE60" strokeWidth={1.5} fill="url(#mcOptimistic)" />
            <Area type="monotone" dataKey="base" name="Base (50th)" stroke="#C9A84C" strokeWidth={2} fill="url(#mcBase)" />
            <Area type="monotone" dataKey="conservative" name="Conservative (10th)" stroke="#F39C12" strokeWidth={1.5} fill="url(#mcConservative)" />
            <ReferenceLine
              y={goal}
              stroke="#F5F5F5"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              label={{ value: 'Goal', fill: '#9CA3AF', fontSize: 10, position: 'insideTopRight' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
