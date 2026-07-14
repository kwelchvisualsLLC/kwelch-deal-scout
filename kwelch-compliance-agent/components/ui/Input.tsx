'use client';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm text-white outline-none transition',
        'placeholder:text-white/30 focus:border-gold',
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50', className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-gold',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
