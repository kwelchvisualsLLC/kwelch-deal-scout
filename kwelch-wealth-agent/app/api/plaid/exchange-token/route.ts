import { NextRequest } from 'next/server'
import { getPlaidClient, isPlaidConfigured } from '@/lib/plaid'
import { getDb } from '@/lib/db'
import { encrypt } from '@/lib/encryption'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isPlaidConfigured()) {
    return fail('Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in .env.local.', 500)
  }

  let body: { public_token?: string }
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  if (!body.public_token) {
    return fail('public_token is required.', 400)
  }

  try {
    const response = await getPlaidClient().itemPublicTokenExchange({
      public_token: body.public_token,
    })
    const { access_token, item_id } = response.data

    const db = getDb()
    // Single-user app: replace any prior connection
    db.prepare('DELETE FROM plaid_connections').run()
    db.prepare(
      'INSERT INTO plaid_connections (institution, access_token_encrypted, item_id, connected_at) VALUES (?, ?, ?, ?)'
    ).run('Robinhood', encrypt(access_token), item_id, new Date().toISOString())

    return ok({ connected: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Plaid error'
    return fail(`Token exchange failed: ${message}`, 502)
  }
}
