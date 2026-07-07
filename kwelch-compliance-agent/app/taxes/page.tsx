'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calculator, PiggyBank } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate, pct } from '@/lib/utils';
import type { TaxBreakdown } from '@/types';

interface EstimateResponse {
  breakdown: TaxBreakdown;
  sepIraLimit: number;
  annualizationNote: string | null;
  inputNetIncome: number;
  annualizedNetIncome: number;
}

export default function TaxesPage() {
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [override, setOverride] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(netIncome?: number, silent = false) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/taxes/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(netIncome !== undefined ? { netIncome } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Estimate failed');
      setResult(data);
    } catch (e) {
      // On the automatic first load, "no QB data yet" is expected — show the
      // neutral hint card instead of an error.
      if (!silent) setError(e instanceof Error ? e.message : 'Estimate failed');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // Try QB-based estimate on load; quietly no-op if QB isn't synced yet.
    run(undefined, true).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const b = result?.breakdown;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Input */}
      <Card>
        <CardHeader
          title="Run Tax Analysis"
          subtitle="Uses QuickBooks net profit (annualized) by default — or project a number yourself"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(override ? Number(override) : undefined);
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="w-56">
            <Label>Projected annual net profit ($)</Label>
            <Input
              type="number"
              placeholder="Leave blank to use QuickBooks"
              value={override}
              onChange={(e) => setOverride(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner className="text-black" /> : <Calculator className="h-4 w-4" />}
            Calculate Federal + CA
          </Button>
          {result?.annualizationNote && <p className="text-xs text-muted">{result.annualizationNote}</p>}
        </form>
        {error && <p className="mt-3 text-sm text-red">{error}</p>}
      </Card>

      {b && (
        <>
          {/* Headline numbers */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Tax Bill" value={formatCurrency(b.totalTax)} sub={`On ${formatCurrency(b.netBusinessIncome)} net`} tone="gold" />
            <StatCard
              label="Federal (income + SE)"
              value={formatCurrency(b.federalTotalTax)}
              sub={`Effective ${pct(b.federalEffectiveRate)} · Marginal ${pct(b.federalMarginalRate, 0)}`}
            />
            <StatCard
              label="California (+$800 LLC)"
              value={formatCurrency(b.caTotalTax)}
              sub={`Effective ${pct(b.caEffectiveRate)} · Marginal ${pct(b.caMarginalRate, 1)}`}
            />
            <StatCard
              label="SE Tax Alone"
              value={formatCurrency(b.seTax)}
              sub={`SS ${formatCurrency(b.seSocialSecurity)} · Medicare ${formatCurrency(b.seMedicare)}`}
              tone="amber"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Waterfall detail */}
            <Card>
              <CardHeader title="Federal Computation" subtitle={`Tax year ${b.taxYear} · single · Schedule C`} />
              <dl className="space-y-2 text-sm">
                {[
                  ['Net business income', b.netBusinessIncome],
                  ['SE taxable base (× 0.9235)', b.seTaxableBase],
                  ['Self-employment tax (15.3%)', b.seTax],
                  ['SE tax deduction (½)', -b.seDeduction],
                  ['AGI', b.agi],
                  ['Standard deduction', -b.standardDeduction],
                  ['QBI deduction (20%)', -b.qbiDeduction],
                  ['Federal taxable income', b.federalTaxableIncome],
                  ['Federal income tax', b.federalIncomeTax],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between border-b border-border/50 pb-1.5">
                    <dt className="text-muted">{label}</dt>
                    <dd className={`font-mono ${(value as number) < 0 ? 'text-green' : 'text-text'}`}>
                      {(value as number) < 0 ? `(${formatCurrency(Math.abs(value as number))})` : formatCurrency(value as number)}
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between pt-1 font-semibold">
                  <dt className="text-gold">Federal total (income + SE)</dt>
                  <dd className="font-mono text-gold">{formatCurrency(b.federalTotalTax)}</dd>
                </div>
              </dl>
            </Card>

            <Card>
              <CardHeader title="California Computation" subtitle="FTB · includes $800 LLC franchise tax" />
              <dl className="space-y-2 text-sm">
                {[
                  ['CA taxable income', b.caTaxableIncome],
                  ['CA income tax (1%–12.3%)', b.caIncomeTax],
                  ['Mental health tax (>$1M)', b.caMentalHealthTax],
                  ['LLC franchise tax (min)', b.caFranchiseTax],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between border-b border-border/50 pb-1.5">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-mono text-text">{formatCurrency(value as number)}</dd>
                  </div>
                ))}
                <div className="flex justify-between pt-1 font-semibold">
                  <dt className="text-gold">California total</dt>
                  <dd className="font-mono text-gold">{formatCurrency(b.caTotalTax)}</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-lg border border-green/30 bg-green/5 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-green">
                  <PiggyBank className="h-4 w-4" /> SEP-IRA opportunity
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  You can shelter up to <span className="font-mono text-green">{formatCurrency(result!.sepIraLimit)}</span> in
                  a SEP-IRA this year (25% of net SE income, $69,000 cap) — deductible on both federal and CA returns.
                </p>
              </div>
            </Card>
          </div>

          {/* Quarterly table + chart */}
          <Card>
            <CardHeader title="Quarterly Estimated Payments" subtitle="Federal: 4 equal installments · CA: 30% / 40% / 0% / 30%" />
            <div className="grid gap-6 lg:grid-cols-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2">Quarter</th>
                    <th className="py-2">Due</th>
                    <th className="py-2 text-right">Federal</th>
                    <th className="py-2 text-right">CA</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {b.quarterly.map((q) => (
                    <tr key={q.quarter} className={`border-b border-border/50 ${q.dueDate < today ? 'opacity-50' : ''}`}>
                      <td className="py-2.5 font-medium text-text">{q.label}</td>
                      <td className="py-2.5 text-muted">{formatDate(q.dueDate)}</td>
                      <td className="py-2.5 text-right font-mono text-text">{formatCurrency(q.federalAmount)}</td>
                      <td className="py-2.5 text-right font-mono text-text">{formatCurrency(q.caAmount)}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-gold">{formatCurrency(q.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={b.quarterly.map((q) => ({ name: q.label.split(' ')[0], Federal: q.federalAmount, CA: q.caAmount }))}>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={{ stroke: '#1E1E1E' }} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={{ stroke: '#1E1E1E' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#F5F5F5' }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Bar dataKey="Federal" stackId="a" fill="#C9A84C" radius={[0, 0, 0, 0]}>
                      {b.quarterly.map((q) => (
                        <Cell key={q.quarter} fillOpacity={q.dueDate < today ? 0.35 : 1} />
                      ))}
                    </Bar>
                    <Bar dataKey="CA" stackId="a" fill="#8a7334" radius={[4, 4, 0, 0]}>
                      {b.quarterly.map((q) => (
                        <Cell key={q.quarter} fillOpacity={q.dueDate < today ? 0.35 : 1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </>
      )}

      {!b && !busy && !error && (
        <Card className="py-12 text-center text-sm text-muted">
          Sync QuickBooks or enter a projected profit above to see your full federal + California breakdown.
        </Card>
      )}
    </div>
  );
}
