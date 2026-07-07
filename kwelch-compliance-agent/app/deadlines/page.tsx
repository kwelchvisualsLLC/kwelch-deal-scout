'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate, dueLabel, cn } from '@/lib/utils';
import type { ComplianceScoreResult, Deadline } from '@/types';

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[] | null>(null);
  const [score, setScore] = useState<ComplianceScoreResult | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'overdue' | 'done'>('open');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', due_date: '', authority: 'IRS', severity: 'medium', amount_due: '' });

  const load = useCallback(() => {
    fetch('/api/compliance/deadlines')
      .then((r) => r.json())
      .then((d) => {
        setDeadlines(d.deadlines);
        setScore(d.score);
      });
  }, []);
  useEffect(load, [load]);

  async function setStatus(id: number, status: string) {
    await fetch(`/api/compliance/deadlines/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function addDeadline(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/compliance/deadlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        due_date: form.due_date,
        authority: form.authority,
        severity: form.severity,
        amount_due: form.amount_due ? Number(form.amount_due) : null,
      }),
    });
    setForm({ title: '', due_date: '', authority: 'IRS', severity: 'medium', amount_due: '' });
    setShowAdd(false);
    load();
  }

  if (!deadlines) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted">
        <Spinner /> Loading calendar…
      </div>
    );
  }

  const done = (d: Deadline) => ['paid', 'filed', 'waived'].includes(d.status);
  const filtered = deadlines.filter((d) => {
    if (filter === 'open') return !done(d);
    if (filter === 'overdue') return d.status === 'overdue';
    if (filter === 'done') return done(d);
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(['open', 'overdue', 'done', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                filter === f ? 'bg-gold/15 text-gold' : 'text-muted hover:text-text',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {score && (
            <span className="text-xs text-muted">
              Score impact: <span className="font-mono text-gold">{score.score}/100</span>
            </span>
          )}
          <Button variant="secondary" onClick={() => setShowAdd((s) => !s)}>
            <Plus className="h-4 w-4" /> Add deadline
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card>
          <CardHeader title="New Deadline" />
          <form onSubmit={addDeadline} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2">
              <Label>Title</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Due date</Label>
              <Input required type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <Label>Authority</Label>
              <Select value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })}>
                <option>IRS</option>
                <option>CA FTB</option>
                <option>CA SOS</option>
                <option>OTHER</option>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>
            <div>
              <Label>Amount due ($)</Label>
              <Input type="number" step="0.01" value={form.amount_due} onChange={(e) => setForm({ ...form, amount_due: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Authority</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-border/60 hover:bg-input/40">
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate font-medium text-text">{d.title}</p>
                  {d.penalty_notes && <p className="mt-0.5 truncate text-xs text-muted">Penalty: {d.penalty_notes}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-mono text-text">{formatDate(d.due_date)}</p>
                  <p className={cn('text-xs', d.status === 'overdue' ? 'text-red' : 'text-muted')}>{dueLabel(d.due_date)}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {d.source_url ? (
                    <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-gold">
                      {d.authority} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    d.authority
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-gold">{d.amount_due != null ? formatCurrency(d.amount_due) : '—'}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(d.severity)}>{d.severity}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(d.status)}>{d.status.replace('_', ' ')}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {!done(d) ? (
                    <button
                      onClick={() => setStatus(d.id, d.category.includes('return') || d.category === 'statement_of_information' ? 'filed' : 'paid')}
                      className="inline-flex items-center gap-1 text-xs text-green hover:underline"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark done
                    </button>
                  ) : (
                    <button onClick={() => setStatus(d.id, 'upcoming')} className="text-xs text-muted hover:text-text">
                      Reopen
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  Nothing here under this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
