import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return fail('A valid numeric id is required.', 400)
  }

  const result = getDb().prepare('DELETE FROM paper_positions WHERE id = ?').run(id)
  if (result.changes === 0) {
    return fail(`No position found with id ${id}.`, 404)
  }
  return ok({ deleted: id })
}
