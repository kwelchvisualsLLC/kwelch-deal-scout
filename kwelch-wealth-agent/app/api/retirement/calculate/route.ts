import { NextRequest } from 'next/server'
import { runMonteCarlo } from '@/lib/monte-carlo'
import { getDb } from '@/lib/db'
import { ok, fail } from '@/lib/api-helpers'

export const runtime = 'nodejs'

interface CalcBody {
  currentAge?: number
  currentSavings?: number
  monthlyContribution?: number
  targetAge?: number
  annualIncomeNeed?: number
}

export async function POST(request: NextRequest) {
  let body: CalcBody
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }

  const currentAge = Number(body.currentAge)
  const currentSavings = Number(body.currentSavings)
  const monthlyContribution = Number(body.monthlyContribution)
  const targetAge = Number(body.targetAge)
  const annualIncomeNeed = Number(body.annualIncomeNeed)

  if (!Number.isFinite(currentAge) || currentAge < 18 || currentAge > 100) {
    return fail('currentAge must be between 18 and 100.', 400)
  }
  if (!Number.isFinite(targetAge) || targetAge <= currentAge || targetAge > 100) {
    return fail('targetAge must be greater than currentAge and at most 100.', 400)
  }
  if (!Number.isFinite(currentSavings) || currentSavings < 0) {
    return fail('currentSavings must be zero or positive.', 400)
  }
  if (!Number.isFinite(monthlyContribution) || monthlyContribution < 0) {
    return fail('monthlyContribution must be zero or positive.', 400)
  }
  if (!Number.isFinite(annualIncomeNeed) || annualIncomeNeed <= 0) {
    return fail('annualIncomeNeed must be positive.', 400)
  }

  const result = runMonteCarlo({
    currentAge,
    currentSavings,
    monthlyContribution,
    targetAge,
    annualIncomeNeed,
  })

  getDb()
    .prepare(
      `INSERT INTO retirement_snapshots (
        current_age, current_savings, monthly_contribution, target_age, income_need_annual,
        snapshot_date, projection_conservative, projection_base, projection_optimistic, probability_of_success
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      currentAge,
      currentSavings,
      monthlyContribution,
      targetAge,
      annualIncomeNeed,
      new Date().toISOString(),
      result.conservative,
      result.base,
      result.optimistic,
      result.probabilityOfSuccess
    )

  return ok(result)
}
