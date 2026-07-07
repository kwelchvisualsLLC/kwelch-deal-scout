import { cn } from '@/lib/utils'
import { PHILOSOPHER_COLORS } from '@/components/agent/PhilosopherAvatar'
import type { PhilosophySignal } from '@/types'

const FULL_NAMES: Record<string, string> = {
  Buffett: 'WARREN BUFFETT',
  Gates: 'BILL GATES',
  Musk: 'ELON MUSK',
  Trump: 'DONALD TRUMP',
}

const VERDICT_STYLES: Record<PhilosophySignal['verdict'], { border: string; icon: string; text: string }> = {
  YES: { border: 'border-green-500/40', icon: '✅', text: 'text-green-400' },
  NO: { border: 'border-red-500/40', icon: '❌', text: 'text-red-400' },
  WAIT: { border: 'border-amber-500/40', icon: '⏳', text: 'text-amber-400' },
}

interface PhilosophyCardProps {
  signal: PhilosophySignal
  metrics?: string
}

export function PhilosophyCard({ signal, metrics }: PhilosophyCardProps) {
  const style = VERDICT_STYLES[signal.verdict]

  return (
    <div className={cn('rounded-md border bg-surface p-4', style.border)}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-display font-bold text-[#0A0A0A]"
          style={{ backgroundColor: PHILOSOPHER_COLORS[signal.philosopher] }}
        >
          {signal.philosopher[0]}
        </span>
        <span className="font-display text-xs font-bold tracking-widest text-[#F5F5F5]">
          {FULL_NAMES[signal.philosopher]}
        </span>
      </div>
      <div className="border-t border-[#1E1E1E] pt-3 space-y-2">
        <p className={cn('text-sm font-mono font-bold', style.text)}>
          Signal: {style.icon} {signal.verdict}
        </p>
        <p className="text-xs font-body text-[#9CA3AF] italic">&ldquo;{signal.reasoning}&rdquo;</p>
        {metrics && <p className="text-[11px] font-mono text-[#9CA3AF]">{metrics}</p>}
      </div>
    </div>
  )
}
