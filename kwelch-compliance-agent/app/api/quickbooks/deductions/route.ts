// Deduction scanner: uses Claude to map QB expense categories + Keith's known
// photography/videography deduction profile into a ranked deduction list.
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/db';
import { getLatestSnapshot } from '@/lib/quickbooks-client';
import type { Deduction } from '@/types';

export const dynamic = 'force-dynamic';

const KEITH_DEDUCTION_PROFILE = `
Known deduction profile for Keith Welch Jr. (photography/videography, CA single-member LLC):
- Camera equipment (Sony FX3 etc.): Section 179 immediate expensing
- Vehicle mileage: 67 cents/mile (2024 rate)
- Home office: simplified $5/sq ft up to 300 sq ft ($1,500 max)
- Software: Final Cut Pro, Adobe Creative Cloud, cloud storage
- Professional services (legal, accounting, contractors)
- Business meals: 50% deductible
- Phone: business-use percentage
- Health insurance premiums: self-employed deduction (above the line)
- SEP-IRA: up to 25% of net SE income, max $69,000 (2024)
`;

export async function GET() {
  const db = getDb();
  const year = new Date().getFullYear();
  const deductions = db
    .prepare(`SELECT * FROM deductions WHERE tax_year IN (?, ?) ORDER BY estimated_amount DESC`)
    .all(year, year - 1) as Deduction[];
  return Response.json({ deductions });
}

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set.' }, { status: 500 });
  }
  const snapshot = getLatestSnapshot();
  const year = new Date().getFullYear();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const qbContext = snapshot
    ? `QuickBooks YTD: revenue $${snapshot.gross_revenue}, expenses $${snapshot.total_expenses}, net $${snapshot.net_profit}. Expense detail: ${snapshot.raw_summary ?? 'n/a'}`
    : 'QuickBooks not synced — estimate from the deduction profile alone, using conservative placeholder amounts.';

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system:
        'You are a deduction scanner for a CA single-member LLC (Schedule C, photography/videography). ' +
        'Respond with ONLY a JSON array (no fence, no commentary). Each item: ' +
        '{"category":"","description":"","estimated_amount":0,"confidence":"high|medium|low","section":"e.g. §179, Schedule C line 22","notes":""}. ' +
        'Include 6-10 items ranked by dollar value. Be specific and conservative.',
      messages: [
        { role: 'user', content: `${KEITH_DEDUCTION_PROFILE}\n\n${qbContext}\n\nTax year: ${year}. Generate the deduction list.` },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end <= start) throw new Error('Scanner returned no parseable list.');
    const items = JSON.parse(text.slice(start, end + 1)) as Partial<Deduction>[];

    const db = getDb();
    const replaceAll = db.transaction(() => {
      db.prepare(`DELETE FROM deductions WHERE tax_year = ?`).run(year);
      const insert = db.prepare(
        `INSERT INTO deductions (category, description, estimated_amount, confidence, tax_year, section, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const item of items) {
        insert.run(
          String(item.category ?? 'Other'),
          String(item.description ?? ''),
          Number(item.estimated_amount) || 0,
          ['high', 'medium', 'low'].includes(String(item.confidence)) ? String(item.confidence) : 'medium',
          year,
          item.section ? String(item.section) : null,
          item.notes ? String(item.notes) : null,
        );
      }
    });
    replaceAll();

    const deductions = db
      .prepare(`SELECT * FROM deductions WHERE tax_year = ? ORDER BY estimated_amount DESC`)
      .all(year) as Deduction[];
    return Response.json({ deductions });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Deduction scan failed' },
      { status: 502 },
    );
  }
}
