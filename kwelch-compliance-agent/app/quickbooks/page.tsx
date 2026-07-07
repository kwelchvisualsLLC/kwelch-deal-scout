'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ScanSearch, Receipt } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Deduction, QBSnapshot } from '@/types';

export default function QuickBooksPage() {
  const [snapshot, setSnapshot] = useState<QBSnapshot | null>(null);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/quickbooks/sync').then((r) => r.json()).then((d) => setSnapshot(d.snapshot));
    fetch('/api/quickbooks/deductions').then((r) => r.json()).then((d) => setDeductions(d.deductions ?? []));
  }, []);
  useEffect(load, [load]);

  async function sync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/quickbooks/sync?force=1', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      setSnapshot(data.snapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function scan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/quickbooks/deductions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setDeductions(data.deductions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  const deductionTotal = deductions.reduce((s, d) => s + d.estimated_amount, 0);
  const expenseDetail: { category: string; amount: number }[] = (() => {
    try {
      return snapshot?.raw_summary ? JSON.parse(snapshot.raw_summary).expense_categories ?? [] : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {snapshot
            ? `Last sync: ${formatDate(snapshot.sync_date.slice(0, 10))} · results cached 30 min`
            : 'No sync yet. Connect and pull live P&L, AR aging, and cash flow.'}
        </p>
        <div className="flex gap-2">
          <Button onClick={sync} disabled={syncing}>
            {syncing ? <Spinner className="text-black" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing…' : 'Sync QuickBooks'}
          </Button>
          <Button variant="secondary" onClick={scan} disabled={scanning}>
            {scanning ? <Spinner /> : <ScanSearch className="h-4 w-4" />}
            {scanning ? 'Scanning…' : 'Run deduction scanner'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red/40 text-sm text-red">
          {error}
          <p className="mt-1 text-xs text-muted">
            QuickBooks connects through the Intuit MCP server. Set ANTHROPIC_API_KEY (and QB_MCP_ACCESS_TOKEN once you
            authorize QuickBooks) in .env.local.
          </p>
        </Card>
      )}

      {snapshot && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Gross Revenue (YTD)" value={formatCurrency(snapshot.gross_revenue)} tone="gold" />
          <StatCard label="Total Expenses" value={formatCurrency(snapshot.total_expenses)} />
          <StatCard label="Net Profit" value={formatCurrency(snapshot.net_profit)} tone={snapshot.net_profit >= 0 ? 'green' : 'red'} />
          <StatCard
            label="Unpaid Invoices (AR)"
            value={formatCurrency(snapshot.unpaid_invoices_total)}
            sub={`${snapshot.unpaid_invoices_count} open · ${formatCurrency(snapshot.ar_over_30)} past 30 days`}
            tone="amber"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expense categories */}
        <Card>
          <CardHeader title="Expense Categories" subtitle="From last P&L pull" />
          {expenseDetail.length === 0 ? (
            <p className="text-sm text-muted">Sync QuickBooks to see the category breakdown.</p>
          ) : (
            <div className="space-y-2">
              {expenseDetail.map((e) => (
                <div key={e.category} className="flex items-center justify-between border-b border-border/50 pb-2 text-sm">
                  <span className="text-text">{e.category}</span>
                  <span className="font-mono text-muted">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Deduction scanner results */}
        <Card>
          <CardHeader
            title="Deduction Scanner"
            subtitle={deductions.length ? `${deductions.length} opportunities · est. ${formatCurrency(deductionTotal)} in write-offs` : 'Photography/videography deduction profile'}
            action={<Receipt className="h-4 w-4 text-gold" />}
          />
          {deductions.length === 0 ? (
            <p className="text-sm text-muted">
              Run the scanner to map your QuickBooks expenses against Keith&apos;s deduction profile — §179 gear,
              mileage, home office, software, meals, health insurance, SEP-IRA.
            </p>
          ) : (
            <div className="space-y-3">
              {deductions.map((d) => (
                <div key={d.id} className="rounded-lg border border-border bg-input/50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text">
                      {d.category}
                      {d.section && <span className="ml-2 font-mono text-xs text-gold">{d.section}</span>}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-green">{formatCurrency(d.estimated_amount)}</span>
                      <Badge tone={d.confidence === 'high' ? 'green' : d.confidence === 'medium' ? 'amber' : 'muted'}>
                        {d.confidence}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{d.description}</p>
                  {d.notes && <p className="mt-1 text-xs italic text-muted/80">{d.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
