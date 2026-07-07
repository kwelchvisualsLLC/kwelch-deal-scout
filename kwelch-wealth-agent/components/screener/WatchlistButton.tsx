'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface WatchlistButtonProps {
  ticker: string
}

export function WatchlistButton({ ticker }: WatchlistButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'added' | 'exists' | 'error'>('idle')

  async function add() {
    setState('loading')
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      if (res.status === 409) setState('exists')
      else if (res.ok) setState('added')
      else setState('error')
    } catch {
      setState('error')
    }
  }

  const label =
    state === 'added'
      ? 'Added ✓'
      : state === 'exists'
        ? 'Already watching'
        : state === 'error'
          ? 'Failed — retry'
          : 'Add to Watchlist'

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={add}
      loading={state === 'loading'}
      disabled={state === 'added' || state === 'exists'}
    >
      <Star className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
