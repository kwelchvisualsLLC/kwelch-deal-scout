import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get('id')
  const id = Number(idParam)
  if (!idParam || !Number.isInteger(id) || id <= 0) {
    return fail('A valid ?id= parameter is required.', 400)
  }

  const result = getDb().prepare('DELETE FROM insurance_policies WHERE id = ?').run(id)
  if (result.changes === 0) {
    return fail(`No policy found with id ${id}.`, 404)
  }
  return ok({ deleted: id })
}
