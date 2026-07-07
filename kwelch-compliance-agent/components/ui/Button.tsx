'use client';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary:
    'bg-gold text-black hover:bg-gold/90 font-semibold shadow-[0_0_20px_rgba(201,168,76,0.15)]',
  secondary: 'border border-border bg-input text-text hover:border-gold/50',
  ghost: 'text-muted hover:text-gold',
  danger: 'border border-red/50 bg-red/10 text-red hover:bg-red/20',
};

export function Button({
  variant = 'primary',
  className,
  disabled,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
