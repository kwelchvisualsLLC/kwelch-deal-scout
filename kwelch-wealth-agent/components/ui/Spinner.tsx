import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C]',
        size === 'sm' && 'h-3.5 w-3.5',
        size === 'md' && 'h-5 w-5',
        size === 'lg' && 'h-8 w-8',
        className
      )}
    />
  )
}
