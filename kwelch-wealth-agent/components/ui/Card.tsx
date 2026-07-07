import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  gold?: boolean
  onClick?: () => void
}

export function Card({ children, className, gold = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface border border-[#1E1E1E] rounded-md p-4',
        gold && 'border-[#C9A84C]/30 shadow-gold',
        onClick && 'cursor-pointer hover:bg-[#1A1A1A] transition-colors',
        className
      )}
    >
      {children}
    </div>
  )
}
