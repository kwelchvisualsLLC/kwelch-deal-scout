import { getDb } from '@/lib/db';
import type { RefundItem } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const refunds = db.prepare(`SELECT * FROM refund_tracker ORDER BY id ASC`).all() as RefundItem[];
  const potential = refunds
    .filter((r) => r.status === 'potential' || r.status === 'claimed')
    .reduce((s, r) => s + (r.estimated_amount ?? 0), 0);
  return Response.json({ refunds, potential_total: potential });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id: number;
    status?: string;
    estimated_amount?: number | null;
    notes?: string;
  };
  if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });
  const db = getDb();

  if (body.status !== undefined) {
    db.prepare(`UPDATE refund_tracker SET status = ?, last_checked = datetime('now') WHERE id = ?`).run(
      body.status,
      body.id,
    );
  }
  if (body.estimated_amount !== undefined) {
    db.prepare(`UPDATE refund_tracker SET estimated_amount = ? WHERE id = ?`).run(body.estimated_amount, body.id);
  }
  if (body.notes !== undefined) {
    db.prepare(`UPDATE refund_tracker SET notes = ? WHERE id = ?`).run(body.notes, body.id);
  }
  const refund = db.prepare(`SELECT * FROM refund_tracker WHERE id = ?`).get(body.id);
  return Response.json({ refund });
}
