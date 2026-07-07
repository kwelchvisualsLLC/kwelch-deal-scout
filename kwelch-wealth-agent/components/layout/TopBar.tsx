'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/agent': 'AI Agent',
  '/screener': 'Stock Screener',
  '/portfolio': 'Portfolio Manager',
  '/retirement': 'Retirement Calculator',
  '/trades': 'Trade History',
  '/insurance': 'Life Insurance',
}

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  async function syncRobinhood() {
    setSyncing(true)
    try {
      await fetch('/api/plaid/portfolio')
      setLastSync(new Date().toLocaleTimeString())
      router.refresh()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#1E1E1E] bg-[#0A0A0A]/95 backdrop-blur px-6 py-3">
      <h1 className="font-display text-lg font-semibold text-[#F5F5F5]">
        {TITLES[pathname] ?? 'KWELCH WEALTH AGENT'}
      </h1>
      <div className="flex items-center gap-3">
        {lastSync && (
          <span className="hidden sm:inline text-[11px] font-mono text-[#9CA3AF]">
            synced {lastSync}
          </span>
        )}
        <Badge variant="amber">PAPER MODE</Badge>
        <Button size="sm" variant="secondary" onClick={syncRobinhood} loading={syncing}>
          {!syncing && <RefreshCw className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Sync Robinhood</span>
        </Button>
      </div>
    </header>
  )
}
