'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Divider } from '@/components/ui/Divider'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'
import type { NetWorth } from '@/types'

type NetWorthData = NetWorth & { robinhoodConnected: boolean }

export function NetWorthSummary() {
  const [data, setData] = useState<NetWorthData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/networth')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data)
        else setError(json.error || 'Failed to load net worth')
      })
      .catch(() => setError('Failed to load net worth'))
  }, [])

  if (error) {
    return (
      <Card>
        <p className="text-sm text-[#C0392B] font-body">{error}</p>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="flex items-center justify-center py-10">
        <Spinner />
      </Card>
    )
  }

  const rows = [
    {
      href: '/portfolio',
      label: 'Robinhood Portfolio',
      value: data.robinhoodValue,
      badge: data.robinhoodConnected ? (
        <Badge variant="green">Live ✓</Badge>
      ) : (
        <Badge variant="gray">Not Connected</Badge>
      ),
    },
    {
      href: '/portfolio',
      label: 'Paper Portfolio',
      value: data.paperPortfolioValue,
      badge: <Badge variant="amber">Simulated</Badge>,
    },
    {
      href: '/insurance',
      label: 'Life Insurance (CSV)',
      value: data.insuranceCashValue,
      badge: <Badge variant="gray">Cash Value Only</Badge>,
    },
  ]

  return (
    <Card gold>
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
        Net Worth Summary
      </h2>
      <div className="space-y-1">
        {rows.map((row) => (
          <Link
            key={row.label}
            href={row.href}
            className="flex items-center justify-between rounded px-2 py-2 hover:bg-[#1A1A1A] transition-colors"
          >
            <span className="text-sm font-body text-[#F5F5F5]">{row.label}</span>
            <span className="flex items-center gap-3">
              <span className="font-display text-sm text-[#F5F5F5]">{formatCurrency(row.value)}</span>
              {row.badge}
            </span>
          </Link>
        ))}
      </div>
      <Divider />
      <div className="flex items-center justify-between px-2">
        <span className="text-sm font-body font-semibold text-[#C9A84C]">Total Tracked</span>
        <span className="font-display text-xl font-bold text-[#C9A84C]">{formatCurrency(data.total)}</span>
      </div>
      <div className="flex items-center justify-between px-2 mt-1">
        <span className="text-xs font-body text-[#9CA3AF]">Retirement Gap (vs {formatCurrency(data.retirementGoal, 0)} goal)</span>
        <span className="font-mono text-sm text-[#C0392B]">
          {formatCurrency(data.retirementGap)}
        </span>
      </div>
    </Card>
  )
}
