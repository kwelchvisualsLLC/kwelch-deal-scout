import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { formatCurrency } from '@/lib/utils'
import type { InsurancePolicy } from '@/types'

const ESTIMATED_ANNUAL_INCOME = 250_000 // solo entrepreneur estimate used for coverage math

export function CoverageAnalysis({ policies }: { policies: InsurancePolicy[] }) {
  const totalDeathBenefit = policies.reduce((sum, p) => sum + p.deathBenefit, 0)
  const totalPremium = policies.reduce((sum, p) => sum + p.annualPremium, 0)
  const recommendedLow = ESTIMATED_ANNUAL_INCOME * 10
  const recommendedHigh = ESTIMATED_ANNUAL_INCOME * 12
  const gap = recommendedLow - totalDeathBenefit
  const premiumPctOfIncome = (totalPremium / ESTIMATED_ANNUAL_INCOME) * 100

  return (
    <Card>
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">
        Coverage Analysis
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] font-body uppercase text-[#9CA3AF]">Recommended Death Benefit</p>
          <p className="font-display text-lg text-[#F5F5F5]">
            {formatCurrency(recommendedLow, 0)} – {formatCurrency(recommendedHigh, 0)}
          </p>
          <p className="text-[11px] font-body text-[#9CA3AF]">10–12× estimated income</p>
        </div>
        <div>
          <p className="text-[10px] font-body uppercase text-[#9CA3AF]">Current Coverage</p>
          <p className="font-display text-lg text-[#F5F5F5]">{formatCurrency(totalDeathBenefit, 0)}</p>
          <p className={`text-[11px] font-mono ${gap > 0 ? 'text-[#C0392B]' : 'text-[#27AE60]'}`}>
            {gap > 0 ? `Gap: ${formatCurrency(gap, 0)} under-covered` : 'Coverage meets the 10× guideline'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-body uppercase text-[#9CA3AF]">Premium Efficiency</p>
          <p className="font-display text-lg text-[#F5F5F5]">{formatCurrency(totalPremium, 0)}/yr</p>
          <p className="text-[11px] font-mono text-[#9CA3AF]">
            = {premiumPctOfIncome.toFixed(1)}% of estimated income
          </p>
        </div>
      </div>

      <Divider />
      <p className="text-[11px] font-body text-[#9CA3AF]">
        Guideline math assumes {formatCurrency(ESTIMATED_ANNUAL_INCOME, 0)} estimated annual income. Ask the AI
        agent for a policy-by-policy efficiency review.
      </p>
    </Card>
  )
}
