import { cn } from '@/lib/utils'

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-[#1E1E1E] my-3', className)} />
}
