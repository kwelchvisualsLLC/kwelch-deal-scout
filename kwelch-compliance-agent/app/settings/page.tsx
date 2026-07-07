'use client';

import { useEffect, useState } from 'react';
import { Lock, Save, ShieldCheck } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

interface Profile {
  business_name: string;
  owner_name: string;
  ein_last4: string | null;
  has_ein: boolean;
  ca_entity_number: string;
  formation_date: string;
  tax_classification: string;
  city: string;
  state: string;
  entity_status: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ein, setEin] = useState('');
  const [form, setForm] = useState({ business_name: '', owner_name: '', ca_entity_number: '', formation_date: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile);
        setForm({
          business_name: d.profile.business_name,
          owner_name: d.profile.owner_name,
          ca_entity_number: d.profile.ca_entity_number,
          formation_date: d.profile.formation_date,
          city: d.profile.city,
        });
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...(ein ? { ein } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setProfile(data.profile);
      setEin('');
      setMessage({ tone: 'green', text: 'Profile saved. EIN encrypted with AES-256-GCM.' });
    } catch (err) {
      setMessage({ tone: 'red', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted">
        <Spinner /> Loading profile…
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader title="Business Profile" subtitle="Drives every calculation and the AI agent's context" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Business name</Label>
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            </div>
            <div>
              <Label>Owner</Label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
            </div>
            <div>
              <Label>CA entity number</Label>
              <Input value={form.ca_entity_number} onChange={(e) => setForm({ ...form, ca_entity_number: e.target.value })} className="font-mono" />
            </div>
            <div>
              <Label>Formation date</Label>
              <Input type="date" value={form.formation_date} onChange={(e) => setForm({ ...form, formation_date: e.target.value })} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>Tax classification</Label>
              <Input value={profile.tax_classification} disabled className="opacity-60" />
            </div>
          </div>
        </Card>

        <Card className="border-gold/30">
          <CardHeader
            title="EIN (Encrypted)"
            subtitle="AES-256-GCM at rest · never logged · never sent to external APIs"
            action={<Lock className="h-4 w-4 text-gold" />}
          />
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-64">
              <Label>Employer Identification Number</Label>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="XX-XXXXXXX"
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                autoComplete="off"
                className="font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <ShieldCheck className="h-4 w-4 text-green" />
              {profile.has_ein ? (
                <span className="text-sm text-muted">
                  Stored: <span className="font-mono text-text">**-***{profile.ein_last4}</span>
                </span>
              ) : (
                <Badge tone="amber">Not set — enter it once, it stays encrypted</Badge>
              )}
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="text-black" /> : <Save className="h-4 w-4" />}
            Save profile
          </Button>
          {message && (
            <p className={`text-sm ${message.tone === 'green' ? 'text-green' : 'text-red'}`}>{message.text}</p>
          )}
        </div>
      </form>

      <Card>
        <CardHeader title="Environment" subtitle="Server-side keys (set in .env.local, restart dev server after edits)" />
        <ul className="space-y-2 font-mono text-xs text-muted">
          <li><span className="text-gold">ANTHROPIC_API_KEY</span> — powers the AI agent, deduction scanner, SOS check, QB sync</li>
          <li><span className="text-gold">QB_MCP_ACCESS_TOKEN</span> — QuickBooks MCP authorization (from Intuit)</li>
          <li><span className="text-gold">ENCRYPTION_KEY</span> — master key for EIN encryption (any long random string)</li>
        </ul>
      </Card>
    </div>
  );
}
