'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';

const TABS: [string, string][] = [
  ['/', 'Dashboard'],
  ['/agent', 'AI Agent'],
  ['/deadlines', 'Deadlines'],
  ['/taxes', 'Taxes'],
  ['/quickbooks', 'QuickBooks'],
  ['/entity', 'Entity'],
  ['/refunds', 'Money Owed'],
];

export default function Header() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/alerts?unread=1')
      .then((r) => (r.ok ? r.json() : { alerts: [] }))
      .then((d) => setUnread(d.alerts?.length ?? 0))
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none tracking-wide text-gold">KWELCH</span>
            <span className="font-display text-3xl leading-none tracking-wide text-white">COMPLIANCE</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-[11px] uppercase tracking-wider text-white/40 sm:block">
              KWelchVisuals LLC · Fairfield, CA
              <br />
              #202202610345 · Schedule C · Entity ACTIVE
            </div>
            <div className="relative rounded-lg border border-border bg-input px-3 py-2">
              <Bell className="h-4 w-4 text-white/70" />
              {unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 font-mono text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </div>
            <Link
              href="/settings"
              title="Settings / EIN"
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                pathname === '/settings'
                  ? 'border-gold/60 bg-input text-gold'
                  : 'border-border bg-input text-white/70 hover:border-gold/60 hover:text-gold'
              }`}
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-t-lg px-3.5 py-2 text-sm font-semibold transition ${
                pathname === href
                  ? 'bg-card text-gold shadow-[inset_0_-2px_0_0_#D4AF37]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
