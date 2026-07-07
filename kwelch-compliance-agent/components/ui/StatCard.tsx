import { Card } from './Card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'default',
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'green' | 'red' | 'amber' | 'gold';
  className?: string;
}) {
  const valueColor =
    tone === 'green' ? 'text-green'
    : tone === 'red' ? 'text-red'
    : tone === 'amber' ? 'text-amber'
    : tone === 'gold' ? 'text-gold'
    : 'text-text';
  return (
    <Card className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
        <p className={cn('mt-1 truncate font-mono text-2xl font-semibold', valueColor)}>{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </div>
      {Icon && (
        <div className="rounded-lg border border-border bg-input p-2">
          <Icon className="h-4 w-4 text-gold" />
        </div>
      )}
    </Card>
  );
}
