import Database from 'better-sqlite3'
import path from 'path'
import { initSchema } from './db-schema'
import { seedDatabase } from './db-seed'

const DB_PATH = path.join(process.cwd(), 'wealth.db')

// Survive Next.js dev-mode module reloads by stashing the handle globally
const globalForDb = globalThis as unknown as { __wealthDb?: Database.Database }

export function getDb(): Database.Database {
  if (!globalForDb.__wealthDb) {
    const db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
    seedDatabase(db)
    globalForDb.__wealthDb = db
  }
  return globalForDb.__wealthDb
}
