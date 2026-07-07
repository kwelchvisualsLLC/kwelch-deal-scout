'use client'

import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import type { InsurancePolicy } from '@/types'

interface PolicyCardProps {
  policy: InsurancePolicy
  onDelete: (id: number) => void
}

export function PolicyCard({ policy, onDelete }: PolicyCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-base font-semibold text-[#F5F5F5]">
            {policy.policyType} — {policy.carrier}
          </h3>
          <p className="font-mono text-xs text-[#9CA3AF]">Policy ***-{policy.policyNumberLast4}</p>
        </div>
        <Badge variant={policy.isPermanent ? 'gold' : 'gray'}>
          {policy.isPermanent ? 'Permanent' : 'Term'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <p className="text-[10px] font-body uppercase text-[#9CA3AF]">Death Benefit</p>
          <p className="font-display text-sm text-[#F5F5F5]">{formatCurrency(policy.deathBenefit, 0)}</p>
        </div>
        <div>
          <p className="text-[10px] font-body uppercase text-[#9CA3AF]">Cash Value</p>
          <p className="font-display text-sm text-[#F5F5F5]">{formatCurrency(policy.cashValue ?? 0, 0)}</p>
        </div>
        <div>
          <p className="text-[10px] font-body uppercase text-[#9CA3AF]">Annual Premium</p>
          <p className="font-display text-sm text-[#F5F5F5]">{formatCurrency(policy.annualPremium, 0)}</p>
        </div>
        <div>
          <p className="text-[10px] font-body uppercase text-[#9CA3AF]">Frequency</p>
          <p className="font-display text-sm text-[#F5F5F5]">{policy.premiumFrequency}</p>
        </div>
      </div>

      {policy.riders.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {policy.riders.map((rider) => (
            <Badge key={rider} variant="gray">{rider}</Badge>
          ))}
        </div>
      )}

      {(policy.loanOutstanding ?? 0) > 0 && (
        <p className="text-xs font-mono text-[#F39C12] mb-3">
          Outstanding loan: {formatCurrency(policy.loanOutstanding ?? 0)}
        </p>
      )}

      <div className="flex justify-between items-center">
        <Link href={`/agent?prompt=Analyze my ${policy.policyType} policy from ${policy.carrier}`}>
          <Button variant="secondary" size="sm">Analyze with AI</Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => onDelete(policy.id)} aria-label="Delete policy">
          <Trash2 className="h-3.5 w-3.5 text-[#C0392B]" />
        </Button>
      </div>
    </Card>
  )
}
