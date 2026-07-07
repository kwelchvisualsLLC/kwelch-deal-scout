'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PRELOADED = ['BRK.B', 'KO', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'OXY', 'RTX']

interface TickerSearchProps {
  onSearch: (ticker: string) => void
  loading?: boolean
}

export function TickerSearch({ onSearch, loading = false }: TickerSearchProps) {
  const [value, setValue] = useState('')

  function submit(ticker: string) {
    const t = ticker.toUpperCase().trim()
    if (t) onSearch(t)
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(value)
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="Enter ticker symbol (e.g. NVDA)"
            className="w-full rounded-md bg-[#1A1A1A] border border-[#1E1E1E] pl-9 pr-3 py-2.5 text-sm font-mono text-[#F5F5F5] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#C9A84C]/60"
          />
        </div>
        <Button type="submit" loading={loading} disabled={!value.trim()}>
          Analyze
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {PRELOADED.map((ticker) => (
          <button
            key={ticker}
            onClick={() => {
              setValue(ticker)
              submit(ticker)
            }}
            disabled={loading}
            className="rounded border border-[#1E1E1E] bg-surface px-3 py-1.5 text-xs font-mono text-[#9CA3AF] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors disabled:opacity-50"
          >
            {ticker}
          </button>
        ))}
      </div>
    </div>
  )
}
