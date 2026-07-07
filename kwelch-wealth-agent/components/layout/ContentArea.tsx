'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// The /agent page is a full-height chat surface — no padding, no scroll on the wrapper
export function ContentArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAgent = pathname === '/agent'
  return (
    <div className={cn('flex-1', isAgent ? 'overflow-hidden' : 'overflow-y-auto p-6')}>
      {children}
    </div>
  )
}
