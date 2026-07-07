import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export async function DELETE(
  _request: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker?.toUpperCase().trim()
  if (!ticker || !/^[A-Z0-9.\-]{1,10}$/.test(ticker)) {
    return fail('A valid ticker is required.', 400)
  }

  const result = getDb().prepare('DELETE FROM watchlist WHERE ticker = ?').run(ticker)
  if (result.changes === 0) {
    return fail(`${ticker} is not on the watchlist.`, 404)
  }
  return ok({ deleted: ticker })
}
