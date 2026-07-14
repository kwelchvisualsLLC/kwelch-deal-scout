// Setup status for the first-run checklist: which keys and data are in place.
// Reports presence only — never values.
import { getDb } from '@/lib/db';
import { getLatestSnapshot } from '@/lib/quickbooks-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const profile = db.prepare(`SELECT ein_encrypted FROM business_profile WHERE id = 1`).get() as {
    ein_encrypted: string | null;
  };
  const snapshot = getLatestSnapshot();

  return Response.json({
    anthropic_key: Boolean(process.env.ANTHROPIC_API_KEY),
    qb_token: Boolean(process.env.QB_MCP_ACCESS_TOKEN),
    has_ein: Boolean(profile?.ein_encrypted),
    qb_synced: Boolean(snapshot),
    snapshot_source: snapshot
      ? (() => {
          try {
            return JSON.parse(snapshot.raw_summary ?? '{}').source === 'manual' ? 'manual' : 'quickbooks';
          } catch {
            return 'quickbooks';
          }
        })()
      : null,
  });
}
