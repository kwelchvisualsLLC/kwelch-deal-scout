import { cn } from '@/lib/utils';

type Tone = 'gold' | 'green' | 'red' | 'amber' | 'muted';

const tones: Record<Tone, string> = {
  gold: 'bg-gold/15 text-gold border-gold/30',
  green: 'bg-green/15 text-green border-green/30',
  red: 'bg-red/15 text-red border-red/30',
  amber: 'bg-amber/15 text-amber border-amber/30',
  muted: 'bg-input text-muted border-border',
};

export function Badge({
  tone = 'muted',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Map deadline/alert status & severity to a badge tone. */
export function statusTone(status: string): Tone {
  switch (status) {
    case 'paid':
    case 'filed':
    case 'claimed':
    case 'compliant':
      return 'green';
    case 'overdue':
    case 'critical':
      return 'red';
    case 'due_soon':
    case 'potential':
    case 'high':
      return 'amber';
    case 'upcoming':
    case 'scheduled':
      return 'gold';
    default:
      return 'muted';
  }
}
