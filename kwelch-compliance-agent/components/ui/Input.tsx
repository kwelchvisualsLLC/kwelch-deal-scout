'use client';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-text',
        'placeholder:text-muted/60 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40',
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted', className)} {...props}>
      {children}
    </label>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-text',
        'focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
