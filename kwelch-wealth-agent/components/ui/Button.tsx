'use client'

import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-body font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-[#C9A84C] text-[#0A0A0A] font-bold hover:bg-[#C9A84C]/90',
        variant === 'secondary' &&
          'border border-[#C9A84C] text-[#C9A84C] bg-transparent hover:bg-[#C9A84C]/10',
        variant === 'ghost' && 'bg-transparent text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
