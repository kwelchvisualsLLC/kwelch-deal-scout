import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const EDITABLE = new Set(['title', 'description', 'due_date', 'status', 'severity', 'amount_due', 'penalty_notes']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const db = getDb();

  for (const [key, value] of Object.entries(body)) {
    if (!EDITABLE.has(key)) continue;
    // Column name comes from a fixed allowlist; the value is parameterized.
    db.prepare(`UPDATE deadlines SET ${key} = ?, updated_at = datetime('now') WHERE id = ?`).run(
      value as string | number | null,
      Number(id),
    );
  }
  const deadline = db.prepare(`SELECT * FROM deadlines WHERE id = ?`).get(Number(id));
  if (!deadline) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ deadline });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare(`DELETE FROM deadlines WHERE id = ?`).run(Number(id));
  return Response.json({ ok: true });
}
