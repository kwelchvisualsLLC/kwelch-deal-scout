import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'green' | 'red' | 'amber' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-mono font-medium border',
        variant === 'gold' && 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20',
        variant === 'green' && 'bg-green-500/10 text-green-400 border-green-500/20',
        variant === 'red' && 'bg-red-500/10 text-red-400 border-red-500/20',
        variant === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        variant === 'gray' && 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        className
      )}
    >
      {children}
    </span>
  )
}
