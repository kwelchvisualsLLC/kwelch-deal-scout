import { cn } from '@/lib/utils'

export const PHILOSOPHER_COLORS: Record<string, string> = {
  Buffett: '#C9A84C',
  Gates: '#3B82F6',
  Musk: '#9CA3AF',
  Trump: '#C0392B',
}

interface PhilosopherAvatarProps {
  content: string
  className?: string
}

// Renders a small colored dot per philosophy referenced in the message
export function PhilosopherAvatar({ content, className }: PhilosopherAvatarProps) {
  const referenced = Object.keys(PHILOSOPHER_COLORS).filter((name) =>
    content.toLowerCase().includes(name.toLowerCase())
  )
  if (referenced.length === 0) return null

  return (
    <span className={cn('flex gap-1', className)}>
      {referenced.map((name) => (
        <span
          key={name}
          title={name}
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: PHILOSOPHER_COLORS[name] }}
        />
      ))}
    </span>
  )
}
