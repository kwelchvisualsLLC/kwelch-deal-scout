import { getPlaidClient, isPlaidConfigured } from '@/lib/plaid'
import { getDb } from '@/lib/db'
import { decrypt } from '@/lib/encryption'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getDb()
  const connection = db
    .prepare('SELECT access_token_encrypted FROM plaid_connections ORDER BY id DESC LIMIT 1')
    .get() as { access_token_encrypted: string } | undefined

  if (!connection) {
    return ok({ connected: false, accounts: [] })
  }
  if (!isPlaidConfigured()) {
    return fail('Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in .env.local.', 500)
  }

  try {
    const accessToken = decrypt(connection.access_token_encrypted)
    const response = await getPlaidClient().accountsGet({ access_token: accessToken })

    const accounts = response.data.accounts.map((a) => ({
      name: a.name,
      type: a.type,
      subtype: a.subtype,
      balanceCurrent: a.balances.current ?? 0,
      balanceAvailable: a.balances.available ?? 0,
    }))

    const totalValue = accounts.reduce((sum, a) => sum + a.balanceCurrent, 0)
    const buyingPower = accounts.reduce((sum, a) => sum + a.balanceAvailable, 0)
    const now = new Date().toISOString()

    const existing = db.prepare('SELECT id FROM robinhood_account ORDER BY id DESC LIMIT 1').get() as
      | { id: number }
      | undefined
    if (existing) {
      db.prepare('UPDATE robinhood_account SET total_value = ?, buying_power = ?, last_synced = ? WHERE id = ?').run(
        totalValue,
        buyingPower,
        now,
        existing.id
      )
    } else {
      db.prepare(
        'INSERT INTO robinhood_account (total_value, buying_power, total_gain_loss, total_gain_loss_pct, last_synced) VALUES (?, ?, 0, 0, ?)'
      ).run(totalValue, buyingPower, now)
    }

    return ok({ connected: true, accounts, totalValue, buyingPower })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Plaid error'
    return fail(`Accounts fetch failed: ${message}`, 502)
  }
}
