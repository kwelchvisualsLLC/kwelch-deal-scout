import { cn } from '@/lib/utils';

/** House-style card: panel bg + signature 3px gold left stripe (kw-card). */
export function Card({
  className,
  children,
  stripe = true,
}: {
  className?: string;
  children: React.ReactNode;
  stripe?: boolean;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', stripe && 'kw-card', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div>
        <h3 className="font-display text-lg leading-none tracking-wide text-gold">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-white/50">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
