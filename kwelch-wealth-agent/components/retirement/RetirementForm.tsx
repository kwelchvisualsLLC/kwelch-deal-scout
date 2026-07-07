'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { MonteCarloInput } from '@/types'

interface RetirementFormProps {
  onCalculate: (input: MonteCarloInput) => void
  loading: boolean
}

export function RetirementForm({ onCalculate, loading }: RetirementFormProps) {
  const [form, setForm] = useState({
    currentAge: '35',
    currentSavings: '50000',
    monthlyContribution: '2000',
    targetAge: '65',
    annualIncomeNeed: '120000',
  })
  const [error, setError] = useState<string | null>(null)

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const input: MonteCarloInput = {
      currentAge: Number(form.currentAge),
      currentSavings: Number(form.currentSavings),
      monthlyContribution: Number(form.monthlyContribution),
      targetAge: Number(form.targetAge),
      annualIncomeNeed: Number(form.annualIncomeNeed),
    }
    if (input.targetAge <= input.currentAge) {
      setError('Target age must be greater than current age.')
      return
    }
    if (Object.values(input).some((v) => !Number.isFinite(v) || v < 0)) {
      setError('All fields must be valid positive numbers.')
      return
    }
    onCalculate(input)
  }

  return (
    <Card>
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">
        Inputs
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Current Age" type="number" min={18} max={100} value={form.currentAge} onChange={update('currentAge')} />
        <Input label="Current Savings ($)" type="number" min={0} step="1000" value={form.currentSavings} onChange={update('currentSavings')} />
        <Input label="Monthly Contribution ($)" type="number" min={0} step="100" value={form.monthlyContribution} onChange={update('monthlyContribution')} />
        <Input label="Target Retirement Age" type="number" min={40} max={100} value={form.targetAge} onChange={update('targetAge')} />
        <Input label="Annual Income Needed ($)" type="number" min={0} step="5000" value={form.annualIncomeNeed} onChange={update('annualIncomeNeed')} />
        {error && <p className="text-xs font-body text-[#C0392B]">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Run Monte Carlo
        </Button>
      </form>
    </Card>
  )
}
