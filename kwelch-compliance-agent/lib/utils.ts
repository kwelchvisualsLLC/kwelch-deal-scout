import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, opts?: { cents?: boolean }): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  }).format(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

/** Human label for how far away/overdue a deadline is. */
export function dueLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  if (d > 1) return `Due in ${d} days`;
  if (d === -1) return '1 day overdue';
  return `${Math.abs(d)} days overdue`;
}

/** EIN display mask: ***-**-XXXX style (last 4 visible). */
export function maskEIN(last4: string | null | undefined): string {
  if (!last4) return 'Not set';
  return `**-***${last4}`;
}

export function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}
