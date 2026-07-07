import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

let client: PlaidApi | null = null

export function getPlaidClient(): PlaidApi {
  if (!client) {
    const env = process.env.PLAID_ENV || 'sandbox'
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    })
    client = new PlaidApi(configuration)
  }
  return client
}

export function isPlaidConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET)
}
