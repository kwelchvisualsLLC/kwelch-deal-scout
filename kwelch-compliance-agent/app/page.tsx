'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Landmark,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { ScoreRing } from '@/components/ScoreRing';
import { SetupChecklist } from '@/components/SetupChecklist';
import { formatCurrency, formatDate, dueLabel } from '@/lib/utils';
import type { Alert, ComplianceScoreResult, Deadline, QBSnapshot } from '@/types';

interface DashboardData {
  score: ComplianceScoreResult;
  upcoming: Deadline[];
  overdue: Deadline[];
  alerts: Alert[];
  snapshot: QBSnapshot | null;
  taxes: {
    federalTotalTax: number;
    caTotalTax: number;
    totalTax: number;
    nextQuarterly: { label: string; dueDate: string; total: number } | null;
  } | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error(`Dashboard failed to load (${r.status})`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  if (error) {
    return <Card className="border-red/40 text-sm text-red">{error}</Card>;
  }
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted">
        <Spinner /> Loading command center…
      </div>
    );
  }

  const { score, upcoming, overdue, alerts, snapshot, taxes } = data;

  return (
    <div className="space-y-6">
      <SetupChecklist />

      {/* Top row: score ring + QB stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-4 py-8">
          <ScoreRing score={score.score} />
          <div className="text-center">
            <p className="text-sm font-semibold text-text">
              Grade <span className="font-mono text-gold">{score.grade}</span>
            </p>
            {score.deductions.length > 0 ? (
              <p className="mt-1 text-xs text-muted">
                {score.deductions.length} issue{score.deductions.length > 1 ? 's' : ''} dragging your score
              </p>
            ) : (
              <p className="mt-1 text-xs text-green">Fully compliant. Keep it that way.</p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            label="YTD Net Profit"
            value={snapshot ? formatCurrency(snapshot.net_profit) : '—'}
            sub={snapshot ? `Synced ${formatDate(snapshot.sync_date.slice(0, 10))}` : 'Sync QuickBooks to populate'}
            icon={TrendingUp}
            tone={snapshot && snapshot.net_profit >= 0 ? 'green' : 'red'}
          />
          <StatCard
            label="YTD Revenue"
            value={snapshot ? formatCurrency(snapshot.gross_revenue) : '—'}
            sub={snapshot ? `Expenses ${formatCurrency(snapshot.total_expenses)}` : undefined}
            icon={Landmark}
          />
          <StatCard
            label="Est. Total Tax (Fed + CA)"
            value={taxes ? formatCurrency(taxes.totalTax) : '—'}
            sub={taxes ? `Fed ${formatCurrency(taxes.federalTotalTax)} · CA ${formatCurrency(taxes.caTotalTax)}` : 'Needs QB data'}
            icon={BadgeDollarSign}
            tone="gold"
          />
          <StatCard
            label="Unpaid Invoices"
            value={snapshot ? formatCurrency(snapshot.unpaid_invoices_total) : '—'}
            sub={snapshot ? `${snapshot.unpaid_invoices_count} open · money owed to YOU` : undefined}
            icon={RefreshCw}
            tone="amber"
          />
        </div>
      </div>

      {/* Overdue banner */}
      {overdue.length > 0 && (
        <Card className="border-red/50 bg-red/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red">
                {overdue.length} overdue deadline{overdue.length > 1 ? 's' : ''} — penalties may be accruing
              </p>
              <p className="text-xs text-muted">{overdue.map((d) => d.title).join(' · ')}</p>
            </div>
            <Link href="/deadlines">
              <Button variant="danger">Resolve now</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next deadlines */}
        <Card>
          <CardHeader
            title="Next Deadlines"
            subtitle="IRS · CA FTB · CA SOS"
            action={
              <Link href="/deadlines" className="flex items-center gap-1 text-xs text-gold hover:underline">
                Full calendar <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted">No upcoming deadlines. Unusual — check the calendar.</p>
            )}
            {upcoming.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-input/50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-text">{d.title}</p>
                  <p className="text-xs text-muted">
                    {formatDate(d.due_date)} · {dueLabel(d.due_date)} · {d.authority}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {d.amount_due != null && (
                    <span className="font-mono text-sm text-gold">{formatCurrency(d.amount_due)}</span>
                  )}
                  <Badge tone={statusTone(d.status)}>{d.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
          {taxes?.nextQuarterly && (
            <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2.5 text-sm">
              <span className="text-muted">
                Next quarterly estimate ({taxes.nextQuarterly.label}, due {formatDate(taxes.nextQuarterly.dueDate)}):{' '}
              </span>
              <span className="font-mono font-semibold text-gold">{formatCurrency(taxes.nextQuarterly.total)}</span>
            </div>
          )}
        </Card>

        {/* Alert feed */}
        <Card>
          <CardHeader
            title="Alert Feed"
            subtitle="Unread signals"
            action={
              alerts.length > 0 ? (
                <button
                  onClick={() =>
                    fetch('/api/alerts', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ markAllRead: true }),
                    }).then(load)
                  }
                  className="text-xs text-muted hover:text-gold"
                >
                  Mark all read
                </button>
              ) : undefined
            }
          />
          <div className="space-y-3">
            {alerts.length === 0 && <p className="text-sm text-muted">All clear. No unread alerts.</p>}
            {alerts.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-input/50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text">{a.title}</p>
                  <Badge tone={statusTone(a.severity)}>{a.severity}</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{a.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/agent">
          <Card className="cursor-pointer transition-colors hover:border-gold/50">
            <p className="text-sm font-semibold text-gold">Ask your tax partner →</p>
            <p className="mt-1 text-xs text-muted">
              &ldquo;How much should I set aside for Q3?&rdquo; · &ldquo;Can I §179 the FX3?&rdquo;
            </p>
          </Card>
        </Link>
        <Link href="/quickbooks">
          <Card className="cursor-pointer transition-colors hover:border-gold/50">
            <p className="text-sm font-semibold text-gold">Sync QuickBooks →</p>
            <p className="mt-1 text-xs text-muted">Pull P&amp;L, AR aging, and run the deduction scanner.</p>
          </Card>
        </Link>
        <Link href="/refunds">
          <Card className="cursor-pointer transition-colors hover:border-gold/50">
            <p className="text-sm font-semibold text-gold">Check money owed to you →</p>
            <p className="mt-1 text-xs text-muted">CA unclaimed property, IRS/FTB refunds, settlements.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
