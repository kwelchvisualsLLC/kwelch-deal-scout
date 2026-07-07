import { getDb, getDeadlines } from '@/lib/db';
import { computeComplianceScore } from '@/lib/compliance-calendar';
import type { Deadline } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const deadlines = getDeadlines() as Deadline[];
  return Response.json({ deadlines, score: computeComplianceScore(deadlines) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Deadline>;
  if (!body.title || !body.due_date) {
    return Response.json({ error: 'title and due_date are required' }, { status: 400 });
  }
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO deadlines (title, description, due_date, category, authority, amount_due, penalty_notes, severity, is_recurring, source_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      body.title,
      body.description ?? null,
      body.due_date,
      body.category ?? 'other',
      body.authority ?? 'OTHER',
      body.amount_due ?? null,
      body.penalty_notes ?? null,
      body.severity ?? 'medium',
      body.is_recurring ? 1 : 0,
      body.source_url ?? null,
    );
  const deadline = db.prepare(`SELECT * FROM deadlines WHERE id = ?`).get(info.lastInsertRowid);
  return Response.json({ deadline }, { status: 201 });
}
