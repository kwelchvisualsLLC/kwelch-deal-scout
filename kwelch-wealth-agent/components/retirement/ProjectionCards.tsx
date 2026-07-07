import { StatCard } from '@/components/ui/StatCard'
import { formatLargeNumber } from '@/lib/utils'
import type { MonteCarloResult } from '@/types'

export function ProjectionCards({ result }: { result: MonteCarloResult }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard label="Conservative (10th pct)" value={formatLargeNumber(result.conservative)} />
      <StatCard label="Base Case (50th pct)" value={formatLargeNumber(result.base)} gold />
      <StatCard label="Optimistic (90th pct)" value={formatLargeNumber(result.optimistic)} />
    </div>
  )
}
