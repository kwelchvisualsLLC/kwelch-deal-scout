'use client'

const ACTIONS = [
  'Analyze my portfolio',
  'What would Buffett buy?',
  'Run retirement numbers',
  'Screen NVDA',
  'Review my insurance',
  'Best dividend stocks',
]

interface QuickActionsProps {
  onAction: (prompt: string) => void
  disabled?: boolean
}

export function QuickActions({ onAction, disabled = false }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <button
          key={action}
          disabled={disabled}
          onClick={() => onAction(action)}
          className="rounded-full border border-[#1E1E1E] bg-[#1A1A1A] px-3 py-1.5 text-xs font-body text-[#9CA3AF] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action}
        </button>
      ))}
    </div>
  )
}
