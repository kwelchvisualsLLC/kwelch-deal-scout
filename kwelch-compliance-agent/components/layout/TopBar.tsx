'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { SignalBadge } from '@/components/ui/SignalBadge';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/agent': 'AI Tax Agent',
  '/deadlines': 'Compliance Deadlines',
  '/taxes': 'Tax Analysis & Quarterly Estimates',
  '/quickbooks': 'QuickBooks Financials',
  '/entity': 'LLC Entity Health',
  '/refunds': 'Money Owed to You',
  '/settings': 'Business Profile & Settings',
};

export default function TopBar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/alerts?unread=1')
      .then((r) => (r.ok ? r.json() : { alerts: [] }))
      .then((d) => setUnread(d.alerts?.length ?? 0))
      .catch(() => {});
  }, [pathname]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/90 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold text-text">{TITLES[pathname] ?? 'KWELCH COMPLIANCE AGENT'}</h1>
        <p className="text-xs text-muted">{today}</p>
      </div>
      <div className="flex items-center gap-5">
        <SignalBadge state="good" label="Entity ACTIVE" />
        <div className="relative">
          <Bell className="h-5 w-5 text-muted" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 font-mono text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
