'use client';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-gold text-black hover:bg-goldsoft font-semibold',
  secondary: 'border border-border bg-input text-white font-semibold hover:border-gold/60',
  ghost: 'text-white/50 hover:text-gold',
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
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition',
        'disabled:cursor-not-allowed disabled:opacity-40',
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
