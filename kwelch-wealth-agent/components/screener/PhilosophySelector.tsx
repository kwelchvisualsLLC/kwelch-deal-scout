'use client'

import { cn } from '@/lib/utils'
import { PHILOSOPHER_COLORS } from '@/components/agent/PhilosopherAvatar'

const PHILOSOPHERS = ['Buffett', 'Gates', 'Musk', 'Trump'] as const
export type Philosopher = (typeof PHILOSOPHERS)[number]

interface PhilosophySelectorProps {
  selected: Philosopher[]
  onToggle: (philosopher: Philosopher) => void
}

export function PhilosophySelector({ selected, onToggle }: PhilosophySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PHILOSOPHERS.map((name) => {
        const active = selected.includes(name)
        return (
          <button
            key={name}
            onClick={() => onToggle(name)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-body transition-colors',
              active
                ? 'border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#F5F5F5]'
                : 'border-[#1E1E1E] bg-surface text-[#9CA3AF] hover:text-[#F5F5F5]'
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PHILOSOPHER_COLORS[name] }} />
            {name}
          </button>
        )
      })}
    </div>
  )
}
