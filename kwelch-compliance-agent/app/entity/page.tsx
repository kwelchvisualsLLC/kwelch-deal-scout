'use client';

import { useEffect, useState } from 'react';
import { Building2, ExternalLink, SearchCheck } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SignalBadge } from '@/components/ui/SignalBadge';
import { formatDate } from '@/lib/utils';

interface EntityInfo {
  entity: {
    name: string;
    caEntityNumber: string;
    formationDate: string;
    status: string;
    taxClassification: string;
    city: string;
    state: string;
    owner: string;
  };
  facts: {
    franchiseTax: { amount: number; due: string; penalty: string; url: string };
    statementOfInformation: { amount: number; cadence: string; url: string };
  };
  next_soi_due: string;
}

export default function EntityPage() {
  const [info, setInfo] = useState<EntityInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [liveResult, setLiveResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/compliance/sos-check').then((r) => r.json()).then(setInfo);
  }, []);

  async function liveCheck() {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance/sos-check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Check failed');
      setLiveResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check failed');
    } finally {
      setChecking(false);
    }
  }

  if (!info) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted">
        <Spinner /> Loading entity record…
      </div>
    );
  }

  const yearsActive = Math.floor(
    (Date.now() - new Date(info.entity.formationDate).getTime()) / (365.25 * 86400_000),
  );

  return (
    <div className="space-y-6">
      {/* Entity card */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-gold/30 bg-gold/10 p-3">
              <Building2 className="h-7 w-7 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-text">{info.entity.name}</h2>
              <p className="mt-0.5 font-mono text-sm text-muted">CA Entity #{info.entity.caEntityNumber}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <SignalBadge state="good" label={`Status: ${info.entity.status}`} />
                <Badge tone="gold">{yearsActive}+ years active</Badge>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={liveCheck} disabled={checking}>
            {checking ? <Spinner /> : <SearchCheck className="h-4 w-4" />}
            {checking ? 'Verifying with CA SOS…' : 'Verify live status'}
          </Button>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Owner</dt>
            <dd className="mt-1 text-text">{info.entity.owner}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Formed</dt>
            <dd className="mt-1 font-mono text-text">{formatDate(info.entity.formationDate)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Location</dt>
            <dd className="mt-1 text-text">{info.entity.city}, {info.entity.state}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Tax classification</dt>
            <dd className="mt-1 text-text">{info.entity.taxClassification}</dd>
          </div>
        </dl>
      </Card>

      {error && <Card className="border-red/40 text-sm text-red">{error}</Card>}
      {liveResult && (
        <Card className="border-gold/40">
          <CardHeader title="Live CA SOS Verification" subtitle="Web-searched moments ago" />
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">{liveResult}</div>
        </Card>
      )}

      {/* Obligations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Annual Franchise Tax" subtitle="CA FTB — the non-negotiable $800" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Amount</span>
              <span className="font-mono text-gold">${info.facts.franchiseTax.amount}/year minimum</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Due</span>
              <span className="text-text">{info.facts.franchiseTax.due}</span>
            </div>
            <div className="rounded-lg border border-red/30 bg-red/5 p-3 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-red">Late penalty: </span>
              {info.facts.franchiseTax.penalty}
            </div>
            <a
              href={info.facts.franchiseTax.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
            >
              Pay via FTB Web Pay <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Card>

        <Card>
          <CardHeader title="Statement of Information" subtitle="CA SOS — biennial filing" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Fee</span>
              <span className="font-mono text-gold">${info.facts.statementOfInformation.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cadence</span>
              <span className="text-text">Every 2 years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Next due</span>
              <span className="font-mono text-text">{formatDate(info.next_soi_due)}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted">{info.facts.statementOfInformation.cadence}</p>
            <a
              href={info.facts.statementOfInformation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
            >
              File at bizfileonline.sos.ca.gov <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Card>
      </div>

      {/* Good standing checklist */}
      <Card>
        <CardHeader title="Good-Standing Checklist" subtitle="What keeps the LLC shield intact" />
        <ul className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            ['$800 franchise tax paid by April 15', 'FTB suspension kills contract enforceability'],
            ['Statement of Information current', '$250 penalty + suspension risk if delinquent'],
            ['Form 568 filed with state return', 'Required for every CA LLC, even single-member'],
            ['Separate business bank account', 'Commingling pierces the liability veil'],
            ['Registered agent info up to date', 'Missed service of process = default judgments'],
            ['Federal + CA returns filed on time', 'Late filing compounds at 5%/month'],
          ].map(([item, why]) => (
            <li key={item} className="rounded-lg border border-border bg-input/50 p-3">
              <p className="font-medium text-text">{item}</p>
              <p className="mt-0.5 text-xs text-muted">{why}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
