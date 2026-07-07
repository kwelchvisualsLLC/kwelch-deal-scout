// SQLite connection singleton. Auto-creates schema and seeds on first use.
// The database file (wealth.db) is gitignored.
import Database from 'better-sqlite3';
import path from 'path';
import { SCHEMA } from './db-schema';
import { seedDatabase, refreshDeadlineStatuses } from './db-seed';

const DB_FILE = process.env.DATABASE_PATH || path.join(process.cwd(), 'wealth.db');

declare global {
  // eslint-disable-next-line no-var
  var __kwelchDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!globalThis.__kwelchDb) {
    const db = new Database(DB_FILE);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA);
    seedDatabase(db);
    globalThis.__kwelchDb = db;
  }
  return globalThis.__kwelchDb;
}

/** Get deadlines with statuses refreshed. */
export function getDeadlines(): unknown[] {
  const db = getDb();
  refreshDeadlineStatuses(db);
  return db.prepare(`SELECT * FROM deadlines ORDER BY due_date ASC`).all();
}

export function addAlert(type: string, severity: string, title: string, message: string): void {
  const db = getDb();
  // De-dupe: skip if an unread alert with the same title exists.
  const existing = db
    .prepare(`SELECT id FROM alerts WHERE title = ? AND is_read = 0`)
    .get(title);
  if (!existing) {
    db.prepare(`INSERT INTO alerts (type, severity, title, message) VALUES (?, ?, ?, ?)`)
      .run(type, severity, title, message);
  }
}
