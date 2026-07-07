// Thin typed client for the Alpaca paper trading REST API.
// Uses fetch directly against ALPACA_BASE_URL so it runs cleanly inside
// Next.js route handlers without the legacy alpaca-trade-api bundle.

export interface AlpacaAccount {
  id: string
  equity: string
  buying_power: string
  cash: string
  portfolio_value: string
  last_equity: string
  status: string
}

export interface AlpacaPosition {
  symbol: string
  qty: string
  avg_entry_price: string
  current_price: string
  market_value: string
  unrealized_pl: string
  unrealized_plpc: string
}

export interface AlpacaOrder {
  id: string
  symbol: string
  qty: string
  side: 'buy' | 'sell'
  status: string
  filled_avg_price: string | null
  filled_qty: string
  submitted_at: string
}

function getBaseUrl(): string {
  return process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets'
}

function getHeaders(): Record<string, string> {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_KEY || '',
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET || '',
    'Content-Type': 'application/json',
  }
}

export function isAlpacaConfigured(): boolean {
  return Boolean(process.env.ALPACA_KEY && process.env.ALPACA_SECRET)
}

async function alpacaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: { ...getHeaders(), ...(init?.headers || {}) },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Alpaca API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export function getAlpacaAccount(): Promise<AlpacaAccount> {
  return alpacaFetch<AlpacaAccount>('/v2/account')
}

export function getAlpacaPositions(): Promise<AlpacaPosition[]> {
  return alpacaFetch<AlpacaPosition[]>('/v2/positions')
}

export function getAlpacaOrders(limit = 100): Promise<AlpacaOrder[]> {
  return alpacaFetch<AlpacaOrder[]>(`/v2/orders?status=all&limit=${limit}&direction=desc`)
}

export function submitAlpacaOrder(params: {
  symbol: string
  qty: number
  side: 'buy' | 'sell'
}): Promise<AlpacaOrder> {
  return alpacaFetch<AlpacaOrder>('/v2/orders', {
    method: 'POST',
    body: JSON.stringify({
      symbol: params.symbol,
      qty: String(params.qty),
      side: params.side,
      type: 'market',
      time_in_force: 'day',
    }),
  })
}
