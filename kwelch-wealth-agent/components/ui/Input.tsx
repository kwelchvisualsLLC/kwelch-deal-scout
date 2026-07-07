'use client'

import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-body text-[#9CA3AF] uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'bg-[#1A1A1A] border border-[#1E1E1E] rounded-md px-3 py-2 text-sm text-[#F5F5F5] font-body',
          'placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#C9A84C]/60 focus:shadow-gold-sm transition-colors',
          className
        )}
        {...props}
      />
    </div>
  )
}
