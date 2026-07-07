// Business profile. EIN is AES-256-GCM encrypted at rest; only last-4 is ever returned.
import { getDb } from '@/lib/db';
import { encrypt, normalizeEIN } from '@/lib/encryption';
import type { BusinessProfile } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const profile = db.prepare(`SELECT * FROM business_profile WHERE id = 1`).get() as BusinessProfile;
  // Never expose the encrypted blob to the client.
  const { ein_encrypted, ...safe } = profile;
  return Response.json({ profile: { ...safe, has_ein: Boolean(ein_encrypted) } });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    business_name: string;
    owner_name: string;
    ein: string;
    ca_entity_number: string;
    formation_date: string;
    tax_classification: string;
    city: string;
    state: string;
  }>;
  const db = getDb();

  if (body.ein !== undefined && body.ein !== '') {
    const ein = normalizeEIN(body.ein);
    if (!ein) {
      return Response.json({ error: 'EIN must be 9 digits (XX-XXXXXXX).' }, { status: 400 });
    }
    db.prepare(
      `UPDATE business_profile SET ein_encrypted = ?, ein_last4 = ?, updated_at = datetime('now') WHERE id = 1`,
    ).run(encrypt(ein), ein.slice(-4));
  }

  const fields: [keyof typeof body, string][] = [
    ['business_name', 'business_name'],
    ['owner_name', 'owner_name'],
    ['ca_entity_number', 'ca_entity_number'],
    ['formation_date', 'formation_date'],
    ['tax_classification', 'tax_classification'],
    ['city', 'city'],
    ['state', 'state'],
  ];
  for (const [key, col] of fields) {
    const value = body[key];
    if (typeof value === 'string' && value.trim()) {
      db.prepare(`UPDATE business_profile SET ${col} = ?, updated_at = datetime('now') WHERE id = 1`).run(
        value.trim(),
      );
    }
  }

  return GET();
}
