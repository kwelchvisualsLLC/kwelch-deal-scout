'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatLargeNumber } from '@/lib/utils'

const GOAL = 3_000_000
const CURRENT_AGE = 35
const TARGET_AGE = 65

interface RetirementTrackerProps {
  currentTotal?: number
}

export function RetirementTracker({ currentTotal = 0 }: RetirementTrackerProps) {
  const progress = Math.min(100, (currentTotal / GOAL) * 100)
  const yearsLeft = TARGET_AGE - CURRENT_AGE

  return (
    <Card className="h-full flex flex-col">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-4">
        Retirement Tracker
      </h2>

      <div className="flex-1 space-y-4">
        <div>
          <div className="flex justify-between text-xs font-mono text-[#9CA3AF] mb-1.5">
            <span>{formatLargeNumber(currentTotal)}</span>
            <span>{formatLargeNumber(GOAL)} goal</span>
          </div>
          <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C9A84C]/60 to-[#C9A84C]"
              style={{ width: `${Math.max(1, progress)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-mono text-[#9CA3AF]">
            {progress.toFixed(1)}% of target · {yearsLeft} years to age {TARGET_AGE}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded bg-[#1A1A1A] p-3">
            <p className="text-[10px] font-body text-[#9CA3AF] uppercase">Target Age</p>
            <p className="font-display text-lg text-[#F5F5F5]">{TARGET_AGE}</p>
          </div>
          <div className="rounded bg-[#1A1A1A] p-3">
            <p className="text-[10px] font-body text-[#9CA3AF] uppercase">Income @ 4%</p>
            <p className="font-display text-lg text-[#F5F5F5]">{formatLargeNumber(GOAL * 0.04)}/yr</p>
          </div>
        </div>
      </div>

      <Link href="/retirement" className="mt-4">
        <Button variant="secondary" size="sm" className="w-full">
          Run Monte Carlo
        </Button>
      </Link>
    </Card>
  )
}
