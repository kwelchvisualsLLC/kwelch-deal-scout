import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return <div className={cn('mx-auto w-full max-w-7xl space-y-6 pb-16', className)}>{children}</div>
}
