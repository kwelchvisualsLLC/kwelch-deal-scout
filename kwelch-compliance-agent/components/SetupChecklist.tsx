'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, KeyRound } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';

interface Health {
  anthropic_key: boolean;
  qb_token: boolean;
  has_ein: boolean;
  qb_synced: boolean;
  snapshot_source: 'manual' | 'quickbooks' | null;
}

/** First-run checklist. Renders nothing once setup is complete. */
export function SetupChecklist() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then(setHealth)
      .catch(() => {});
  }, []);

  if (!health) return null;
  const allDone = health.anthropic_key && health.qb_token && health.has_ein && health.qb_synced;
  if (allDone) return null;

  const items: { done: boolean; label: React.ReactNode; detail: React.ReactNode }[] = [
    {
      done: health.has_ein,
      label: (
        <>
          Enter your EIN in <Link href="/settings" className="text-gold underline">Settings</Link>
        </>
      ),
      detail: 'Encrypted immediately with AES-256-GCM. Only the last 4 digits are ever shown.',
    },
    {
      done: health.qb_synced,
      label: (
        <>
          Get financials in — <Link href="/quickbooks" className="text-gold underline">sync QuickBooks</Link> or enter
          YTD revenue/expenses manually
        </>
      ),
      detail:
        health.snapshot_source === 'manual'
          ? 'Manual figures loaded — tax analysis is live. Swap in a real sync when QuickBooks is authorized.'
          : 'Unlocks the tax analysis, quarterly estimates, and dashboard stats. Manual entry works with zero API keys.',
    },
    {
      done: health.anthropic_key,
      label: (
        <>
          Add <code className="rounded bg-input px-1 font-mono text-xs text-gold">ANTHROPIC_API_KEY</code> to{' '}
          <code className="rounded bg-input px-1 font-mono text-xs">.env.local</code>
        </>
      ),
      detail: 'Get one at console.anthropic.com → API Keys. Powers the AI agent, deduction scanner, and SOS live check. Restart the dev server after adding it.',
    },
    {
      done: health.qb_token,
      label: (
        <>
          Add <code className="rounded bg-input px-1 font-mono text-xs text-gold">QB_MCP_ACCESS_TOKEN</code> once Intuit
          issues it
        </>
      ),
      detail: 'Authorizes the live QuickBooks MCP connection (ai-inc.quickbooks.intuit.com). Until then, manual entry keeps everything working.',
    },
  ];

  const remaining = items.filter((i) => !i.done).length;

  return (
    <Card className="border-gold/40 bg-gold/5">
      <CardHeader
        title="Finish Setup"
        subtitle={`${items.length - remaining}/${items.length} done — the app works today; each step unlocks more`}
        action={<KeyRound className="h-4 w-4 text-gold" />}
      />
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            )}
            <div>
              <p className={`text-sm ${item.done ? 'text-muted line-through' : 'text-text'}`}>{item.label}</p>
              {!item.done && <p className="mt-0.5 text-xs text-muted">{item.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
