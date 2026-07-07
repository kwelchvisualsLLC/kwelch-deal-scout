'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RobinhoodPanel } from '@/components/portfolio/RobinhoodPanel'
import { PaperPortfolioPanel } from '@/components/portfolio/PaperPortfolioPanel'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NetWorthSummary } from '@/components/dashboard/NetWorthSummary'
import { cn } from '@/lib/utils'

const TABS = ['ROBINHOOD', 'PAPER PORTFOLIO', 'COMBINED'] as const
type Tab = (typeof TABS)[number]

export default function PortfolioPage() {
  const [tab, setTab] = useState<Tab>('ROBINHOOD')

  return (
    <PageWrapper>
      <div className="flex gap-1 border-b border-[#1E1E1E]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-xs font-display font-semibold tracking-widest border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-[#C9A84C] text-[#C9A84C]'
                : 'border-transparent text-[#9CA3AF] hover:text-[#F5F5F5]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'ROBINHOOD' && <RobinhoodPanel />}
      {tab === 'PAPER PORTFOLIO' && <PaperPortfolioPanel />}
      {tab === 'COMBINED' && (
        <div className="space-y-6">
          <NetWorthSummary />
          <RobinhoodPanel />
          <PaperPortfolioPanel />
        </div>
      )}

      <Card>
        <div className="flex justify-end">
          <Link href="/agent?prompt=Analyze my full portfolio — Robinhood and paper trading combined">
            <Button variant="secondary" size="sm">Analyze this portfolio with AI</Button>
          </Link>
        </div>
      </Card>
    </PageWrapper>
  )
}
