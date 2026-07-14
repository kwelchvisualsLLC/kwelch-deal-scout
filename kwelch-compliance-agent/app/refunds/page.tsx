'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, HandCoins } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { RefundItem } from '@/types';

const STATUS_OPTIONS = [
  ['unchecked', 'Not checked yet'],
  ['checking', 'Checking'],
  ['potential', 'Money found!'],
  ['claimed', 'Claimed'],
  ['none_found', 'Nothing found'],
] as const;

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[] | null>(null);
  const [potential, setPotential] = useState(0);

  const load = useCallback(() => {
    fetch('/api/refunds')
      .then((r) => r.json())
      .then((d) => {
        setRefunds(d.refunds);
        setPotential(d.potential_total);
      });
  }, []);
  useEffect(load, [load]);

  async function update(id: number, patch: Record<string, unknown>) {
    await fetch('/api/refunds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    load();
  }

  if (!refunds) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted">
        <Spinner /> Loading refund tracker…
      </div>
    );
  }

  const checked = refunds.filter((r) => r.status !== 'unchecked').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Potential Money Found"
          value={formatCurrency(potential)}
          sub="Across items marked found/claimed"
          icon={HandCoins}
          tone={potential > 0 ? 'green' : 'default'}
        />
        <StatCard label="Sources Tracked" value={String(refunds.length)} sub="Government + settlement databases" />
        <StatCard label="Checked" value={`${checked}/${refunds.length}`} sub="Work the list — searches take 2 minutes each" tone="gold" />
      </div>

      <Card>
        <CardHeader
          title="Money Owed to You"
          subtitle="Unclaimed property, tax refunds, and settlements — checked against Keith Welch / KWelchVisuals LLC"
        />
        <div className="space-y-4">
          {refunds.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-input/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text">{r.source}</p>
                    <Badge tone={statusTone(r.status)}>{r.status.replace('_', ' ')}</Badge>
                    {r.last_checked && (
                      <span className="text-[11px] text-muted">checked {formatDate(r.last_checked.slice(0, 10))}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{r.description}</p>
                  {r.notes && <p className="mt-1 text-xs italic text-muted/80">{r.notes}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {r.estimated_amount != null && (
                    <span className="font-mono text-lg font-semibold text-green">{formatCurrency(r.estimated_amount)}</span>
                  )}
                  {r.action_url && (
                    <a
                      href={r.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20"
                    >
                      Search now <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <Select
                    className="w-40 py-1 text-xs"
                    value={r.status}
                    onChange={(e) => update(r.id, { status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  {(r.status === 'potential' || r.status === 'claimed') && (
                    <input
                      type="number"
                      placeholder="Amount found $"
                      defaultValue={r.estimated_amount ?? ''}
                      onBlur={(e) =>
                        update(r.id, { estimated_amount: e.target.value ? Number(e.target.value) : null })
                      }
                      className="w-40 rounded-lg border border-border bg-input px-2 py-1 text-right font-mono text-xs text-green focus:border-gold/60 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-gold/30 bg-gold/5">
        <p className="text-sm font-semibold text-gold">Pro move</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Run the CA unclaimed property search under every name variant: &ldquo;Keith Welch&rdquo;, &ldquo;Keith Welch
          Jr&rdquo;, &ldquo;KWelchVisuals&rdquo;, &ldquo;K Welch Visuals&rdquo; — and every old address. Federal refunds
          expire 3 years after the filing deadline; California honors claims indefinitely but why wait.
        </p>
      </Card>
    </div>
  );
}
