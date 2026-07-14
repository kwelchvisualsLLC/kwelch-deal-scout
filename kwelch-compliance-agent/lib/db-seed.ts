import type BetterSqlite3 from 'better-sqlite3';
import { generateDeadlines } from './compliance-calendar';

/** Idempotent first-run seed: profile row, current-year deadlines, refund sources. */
export function seedDatabase(db: BetterSqlite3.Database): void {
  const year = new Date().getFullYear();

  // Business profile singleton
  db.prepare(
    `INSERT OR IGNORE INTO business_profile (id) VALUES (1)`,
  ).run();

  // Deadlines (unique on title + due_date, so re-running is a no-op)
  const insertDeadline = db.prepare(`
    INSERT OR IGNORE INTO deadlines
      (title, description, due_date, category, authority, amount_due,
       penalty_per_day, penalty_notes, severity, status, is_recurring, recurrence_rule, source_url)
    VALUES
      (@title, @description, @due_date, @category, @authority, @amount_due,
       @penalty_per_day, @penalty_notes, @severity, 'upcoming', @is_recurring, @recurrence_rule, @source_url)
  `);
  const seedAll = db.transaction(() => {
    for (const d of generateDeadlines(year)) insertDeadline.run(d);
    // Also seed next year's Q4-adjacent items appear naturally via the Jan 15 date.
  });
  seedAll();

  // Mark anything already past as overdue on seed.
  db.prepare(
    `UPDATE deadlines SET status = 'overdue'
     WHERE status = 'upcoming' AND due_date < date('now')`,
  ).run();

  // Refund tracker sources (money owed TO Keith)
  const refundCount = (db.prepare(`SELECT COUNT(*) AS c FROM refund_tracker`).get() as { c: number }).c;
  if (refundCount === 0) {
    const insertRefund = db.prepare(`
      INSERT INTO refund_tracker (source, description, estimated_amount, status, action_url, notes)
      VALUES (?, ?, ?, 'unchecked', ?, ?)
    `);
    const refunds: [string, string, number | null, string, string | null][] = [
      [
        'CA Unclaimed Property (SCO)',
        'Search the CA State Controller unclaimed property database for "Keith Welch" and "KWelchVisuals" — forgotten deposits, refunds, insurance payouts.',
        null,
        'https://ucpi.sco.ca.gov/ucp/',
        'Free search. Check personal name, LLC name, and old addresses.',
      ],
      [
        'IRS Refund Tracker',
        'Check "Where’s My Refund" for any unclaimed federal refunds from prior-year returns.',
        null,
        'https://www.irs.gov/wheres-my-refund',
        'Refunds expire 3 years after the filing deadline — claim before the window closes.',
      ],
      [
        'CA FTB Refund Status',
        'Check California FTB refund status for prior-year state returns.',
        null,
        'https://www.ftb.ca.gov/refund/index.asp',
        null,
      ],
      [
        'MissingMoney.com (multi-state)',
        'NAUPA-endorsed national unclaimed property search — covers states beyond CA where clients or platforms may have reported funds.',
        null,
        'https://missingmoney.com',
        'Check any state you’ve lived or done business in.',
      ],
      [
        'IRS Estimated Tax Overpayment',
        'If prior-year estimated payments exceeded final liability and weren’t applied forward, a refund may be claimable via amended return.',
        null,
        'https://www.irs.gov/payments/your-online-account',
        'Verify payment history in the IRS online account.',
      ],
      [
        'Class Action / Platform Settlements',
        'Photography and creator-platform settlements (e.g. payment processors, stock platforms) sometimes owe funds to business users.',
        null,
        'https://topclassactions.com',
        null,
      ],
    ];
    const tx = db.transaction(() => {
      for (const r of refunds) insertRefund.run(r[0], r[1], r[2], r[3], r[4]);
    });
    tx();
  }

  // Welcome alert on first run
  const alertCount = (db.prepare(`SELECT COUNT(*) AS c FROM alerts`).get() as { c: number }).c;
  if (alertCount === 0) {
    db.prepare(
      `INSERT INTO alerts (type, severity, title, message)
       VALUES ('system', 'low', 'KWELCH COMPLIANCE AGENT initialized',
               'Deadline calendar seeded for ${year}. Enter your EIN in Settings and run a QuickBooks sync to unlock tax analysis.')`,
    ).run();
  }
}

/** Refresh derived statuses (upcoming → due_soon/overdue) — cheap, run on reads. */
export function refreshDeadlineStatuses(db: BetterSqlite3.Database): void {
  db.prepare(
    `UPDATE deadlines SET status = 'overdue', updated_at = datetime('now')
     WHERE status IN ('upcoming','due_soon') AND due_date < date('now')`,
  ).run();
  db.prepare(
    `UPDATE deadlines SET status = 'due_soon', updated_at = datetime('now')
     WHERE status = 'upcoming' AND due_date <= date('now', '+14 days') AND due_date >= date('now')`,
  ).run();
}
