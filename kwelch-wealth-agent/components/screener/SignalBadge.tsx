import { cn } from '@/lib/utils'

interface SignalBadgeProps {
  signal: 'BUY' | 'HOLD' | 'SELL' | 'WATCH'
  confidence: number
  className?: string
}

export function SignalBadge({ signal, confidence, className }: SignalBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono font-bold border',
        signal === 'BUY' && 'bg-green-500/10 text-green-400 border-green-500/20',
        signal === 'SELL' && 'bg-red-500/10 text-red-400 border-red-500/20',
        signal === 'WATCH' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        signal === 'HOLD' && 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        className
      )}
    >
      {signal} {Math.round(confidence)}%
    </span>
  )
}
