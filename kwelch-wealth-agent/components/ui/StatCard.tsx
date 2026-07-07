import { Card } from './Card'
import { cn, formatCurrency, formatPct } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  change?: number
  changePct?: number
  icon?: React.ReactNode
  gold?: boolean
}

export function StatCard({ label, value, change, changePct, icon, gold = false }: StatCardProps) {
  const hasDelta = change !== undefined || changePct !== undefined
  const positive = (change ?? changePct ?? 0) >= 0

  return (
    <Card gold={gold}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-body text-[#9CA3AF] uppercase tracking-wide">{label}</p>
          <p className={cn('mt-1 text-2xl font-display font-semibold', gold ? 'text-[#C9A84C]' : 'text-[#F5F5F5]')}>
            {value}
          </p>
          {hasDelta && (
            <p
              className={cn(
                'mt-1 text-xs font-mono',
                positive ? 'text-[#27AE60]' : 'text-[#C0392B]'
              )}
            >
              {positive ? '▲' : '▼'}{' '}
              {change !== undefined && formatCurrency(Math.abs(change))}
              {change !== undefined && changePct !== undefined && ' · '}
              {changePct !== undefined && formatPct(changePct)}
            </p>
          )}
        </div>
        {icon && <div className="text-[#C9A84C]">{icon}</div>}
      </div>
    </Card>
  )
}
