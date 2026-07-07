import { getDb } from '@/lib/db'
import { ok } from '@/lib/api-helpers'
import type { InsurancePolicy } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PolicyRow {
  id: number
  policy_type: string | null
  carrier: string | null
  policy_number_last4: string | null
  death_benefit: number
  cash_value: number
  surrender_value: number
  annual_premium: number
  premium_frequency: string
  policy_start_date: string | null
  policy_end_date: string | null
  is_permanent: number
  riders: string
  loan_outstanding: number
  uploaded_at: string | null
}

export async function GET() {
  const rows = getDb()
    .prepare('SELECT * FROM insurance_policies ORDER BY id DESC')
    .all() as PolicyRow[]

  const policies: InsurancePolicy[] = rows.map((row) => {
    let riders: string[] = []
    try {
      riders = JSON.parse(row.riders || '[]')
    } catch {
      riders = []
    }
    return {
      id: row.id,
      policyType: row.policy_type ?? 'Unknown',
      carrier: row.carrier ?? 'Unknown',
      policyNumberLast4: row.policy_number_last4 ?? '????',
      deathBenefit: row.death_benefit,
      cashValue: row.cash_value,
      surrenderValue: row.surrender_value,
      annualPremium: row.annual_premium,
      premiumFrequency: row.premium_frequency,
      policyStartDate: row.policy_start_date ?? '',
      policyEndDate: row.policy_end_date,
      isPermanent: row.is_permanent === 1,
      riders,
      loanOutstanding: row.loan_outstanding,
      uploadedAt: row.uploaded_at ?? '',
    }
  })

  return ok(policies)
}
