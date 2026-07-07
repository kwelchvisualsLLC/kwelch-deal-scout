'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareText,
  CalendarClock,
  Calculator,
  Landmark,
  Building2,
  HandCoins,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agent', label: 'AI Tax Agent', icon: MessageSquareText },
  { href: '/deadlines', label: 'Deadlines', icon: CalendarClock },
  { href: '/taxes', label: 'Tax Analysis', icon: Calculator },
  { href: '/quickbooks', label: 'QuickBooks', icon: Landmark },
  { href: '/entity', label: 'Entity Health', icon: Building2 },
  { href: '/refunds', label: 'Money Owed', icon: HandCoins },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
        <div className="rounded-lg bg-gold/15 p-2">
          <ShieldCheck className="h-5 w-5 text-gold" />
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-wide text-gold">KWELCH</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Compliance Agent</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-gold/15 font-semibold text-gold'
                  : 'text-muted hover:bg-input hover:text-text',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-[10px] leading-relaxed text-muted">
        KWelchVisuals LLC · #202202610345
        <br />
        Fairfield, CA · Schedule C
      </div>
    </aside>
  );
}
