import { CountryCode, Products } from 'plaid'
import { getPlaidClient, isPlaidConfigured } from '@/lib/plaid'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export async function POST() {
  if (!isPlaidConfigured()) {
    return fail('Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in .env.local.', 500)
  }

  try {
    const response = await getPlaidClient().linkTokenCreate({
      user: { client_user_id: 'kwelch-primary' },
      client_name: 'KWELCH WEALTH AGENT',
      products: [Products.Investments],
      country_codes: [CountryCode.Us],
      language: 'en',
    })
    return ok({ link_token: response.data.link_token })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Plaid error'
    return fail(`Could not create Plaid link token: ${message}`, 502)
  }
}
