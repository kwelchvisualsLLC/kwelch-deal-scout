import { getDb } from '@/lib/db';
import type { Alert } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const db = getDb();
  const unreadOnly = new URL(request.url).searchParams.get('unread') === '1';
  const alerts = (unreadOnly
    ? db.prepare(`SELECT * FROM alerts WHERE is_read = 0 ORDER BY created_at DESC LIMIT 50`).all()
    : db.prepare(`SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50`).all()) as Alert[];
  return Response.json({ alerts });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: number; markAllRead?: boolean };
  const db = getDb();
  if (body.markAllRead) {
    db.prepare(`UPDATE alerts SET is_read = 1 WHERE is_read = 0`).run();
  } else if (body.id) {
    db.prepare(`UPDATE alerts SET is_read = 1 WHERE id = ?`).run(body.id);
  }
  return Response.json({ ok: true });
}
