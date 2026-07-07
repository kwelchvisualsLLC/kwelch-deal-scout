'use client'

import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RetirementForm } from '@/components/retirement/RetirementForm'
import { MonteCarloChart } from '@/components/retirement/MonteCarloChart'
import { ProjectionCards } from '@/components/retirement/ProjectionCards'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import type { MonteCarloInput, MonteCarloResult } from '@/types'

export default function RetirementPage() {
  const [result, setResult] = useState<MonteCarloResult | null>(null)
  const [lastInput, setLastInput] = useState<MonteCarloInput | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function calculate(input: MonteCarloInput) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/retirement/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Calculation failed')
      setResult(json.data as MonteCarloResult)
      setLastInput(input)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setLoading(false)
    }
  }

  const goal = lastInput ? lastInput.annualIncomeNeed / 0.04 : 3_000_000
  const probability = result?.probabilityOfSuccess ?? 0
  // Rough guidance: linear-ish scaling of contribution toward a 90% success target
  const requiredMonthly =
    result && lastInput && probability < 90
      ? Math.ceil((lastInput.monthlyContribution * (90 / Math.max(probability, 5)) ) / 100) * 100
      : null

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <RetirementForm onCalculate={calculate} loading={loading} />
        </div>

        <div className="lg:col-span-3 space-y-6">
          {error && (
            <Card>
              <p className="text-sm font-body text-[#C0392B]">{error}</p>
            </Card>
          )}

          {!result && !error && (
            <Card>
              <p className="text-center text-sm font-body text-[#9CA3AF] py-12">
                Set your inputs and run the Monte Carlo simulation — 1,000 market scenarios at 7% mean
                return and 15% volatility.
              </p>
            </Card>
          )}

          {result && lastInput && (
            <>
              <ProjectionCards result={result} />

              <MonteCarloChart data={result.yearlyData} goal={goal} />

              <Card gold>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-body text-[#9CA3AF] uppercase tracking-wide">
                      Probability of Success
                    </p>
                    <p className="font-display text-3xl font-bold text-[#C9A84C]">
                      {probability.toFixed(1)}%
                    </p>
                    <p className="text-[11px] font-body text-[#9CA3AF]">
                      Runs where a 4% withdrawal covers {formatCurrency(lastInput.annualIncomeNeed, 0)}/yr
                    </p>
                  </div>
                  <Badge variant={probability >= 90 ? 'green' : probability >= 70 ? 'amber' : 'red'}>
                    {probability >= 90 ? 'ON TRACK' : probability >= 70 ? 'CLOSE — PUSH HARDER' : 'OFF TRACK'}
                  </Badge>
                </div>
              </Card>

              <Card>
                <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">
                  AI Commentary
                </h3>
                <p className="text-sm font-body text-[#F5F5F5] leading-relaxed">
                  At your current pace of {formatCurrency(lastInput.monthlyContribution, 0)}/month, the base
                  case lands at {formatCurrency(result.base, 0)} by age {lastInput.targetAge} — a{' '}
                  {probability.toFixed(0)}% chance of sustaining {formatCurrency(lastInput.annualIncomeNeed, 0)}
                  /yr on the 4% rule.{' '}
                  {requiredMonthly
                    ? `To push success probability toward 90%, raise the monthly contribution to roughly ${formatCurrency(requiredMonthly, 0)}. Compounding rewards the early dollars most — Buffett's rule: the best time to plant the tree was 20 years ago; the second best time is this month's transfer.`
                    : `You clear the 90% bar. Buffett's take: don't interrupt the compounding — automate the contribution and never touch the principal.`}
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
