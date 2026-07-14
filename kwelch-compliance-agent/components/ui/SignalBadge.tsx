import { cn } from '@/lib/utils';

/** Pulsing status dot + label — used for entity status / sync state. */
export function SignalBadge({
  state,
  label,
  className,
}: {
  state: 'good' | 'warn' | 'bad' | 'idle';
  label: string;
  className?: string;
}) {
  const dot =
    state === 'good' ? 'bg-green'
    : state === 'warn' ? 'bg-amber'
    : state === 'bad' ? 'bg-red'
    : 'bg-muted';
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-medium text-muted', className)}>
      <span className={cn('h-2 w-2 rounded-full', dot, state !== 'idle' && 'animate-pulse-gold')} />
      {label}
    </span>
  );
}
