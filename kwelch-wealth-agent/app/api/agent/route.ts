import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { AGENT_SYSTEM_PROMPT } from '@/lib/agent-prompt'
import { fail, rateLimit } from '@/lib/api-helpers'
import { formatCurrency } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface IncomingMessage {
  role: 'user' | 'assistant'
  content: string
}

function buildFinancialContext(): string {
  const db = getDb()
  const parts: string[] = []

  const holdings = db
    .prepare('SELECT ticker, quantity, cost_basis, current_price, market_value, unrealized_pnl_pct FROM robinhood_holdings')
    .all() as {
    ticker: string
    quantity: number
    cost_basis: number
    current_price: number
    market_value: number
    unrealized_pnl_pct: number
  }[]

  if (holdings.length > 0) {
    parts.push(
      'ROBINHOOD LIVE HOLDINGS:\n' +
        holdings
          .map(
            (h) =>
              `- ${h.ticker}: ${h.quantity} shares, avg cost ${formatCurrency(h.cost_basis)}, now ${formatCurrency(h.current_price)}, value ${formatCurrency(h.market_value)} (${h.unrealized_pnl_pct.toFixed(2)}%)`
          )
          .join('\n')
    )
  } else {
    parts.push('ROBINHOOD: not connected yet (no live holdings synced).')
  }

  const positions = db
    .prepare("SELECT ticker, shares, entry_price, entry_date, philosophy, conviction FROM paper_positions WHERE status = 'open'")
    .all() as {
    ticker: string
    shares: number
    entry_price: number
    entry_date: string
    philosophy: string | null
    conviction: string | null
  }[]

  if (positions.length > 0) {
    parts.push(
      'PAPER TRADING POSITIONS:\n' +
        positions
          .map(
            (p) =>
              `- ${p.ticker}: ${p.shares} shares @ ${formatCurrency(p.entry_price)} since ${p.entry_date} [${p.philosophy ?? 'n/a'} / ${p.conviction ?? 'n/a'}]`
          )
          .join('\n')
    )
  }

  const policies = db
    .prepare('SELECT policy_type, carrier, death_benefit, cash_value, annual_premium, is_permanent FROM insurance_policies')
    .all() as {
    policy_type: string | null
    carrier: string | null
    death_benefit: number
    cash_value: number
    annual_premium: number
    is_permanent: number
  }[]

  if (policies.length > 0) {
    parts.push(
      'LIFE INSURANCE POLICIES:\n' +
        policies
          .map(
            (p) =>
              `- ${p.policy_type ?? 'Unknown'} (${p.carrier ?? 'Unknown carrier'}): death benefit ${formatCurrency(p.death_benefit)}, cash value ${formatCurrency(p.cash_value)}, premium ${formatCurrency(p.annual_premium)}/yr, ${p.is_permanent ? 'permanent' : 'term'}`
          )
          .join('\n')
    )
  } else {
    parts.push('LIFE INSURANCE: no policies uploaded yet.')
  }

  return parts.join('\n\n')
}

export async function POST(request: NextRequest) {
  if (!rateLimit('agent', 20)) {
    return fail('Rate limit exceeded — max 20 requests per minute.', 429)
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail('ANTHROPIC_API_KEY is not configured. Add it to .env.local.', 500)
  }

  let body: { messages?: IncomingMessage[] }
  try {
    body = await request.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }

  const messages = (body.messages || []).filter(
    (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0
  )
  if (messages.length === 0) {
    return fail('messages array is required.', 400)
  }

  const db = getDb()
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (lastUser) {
    db.prepare('INSERT INTO chat_messages (role, content, timestamp) VALUES (?, ?, ?)').run(
      'user',
      lastUser.content,
      new Date().toISOString()
    )
  }

  const anthropic = new Anthropic()
  const financialContext = buildFinancialContext()

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `${AGENT_SYSTEM_PROMPT}\n\nCURRENT FINANCIAL SNAPSHOT (live from database):\n${financialContext}`,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  // Persist the assistant reply once the stream completes
  stream
    .finalMessage()
    .then((message) => {
      const text = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('')
      if (text) {
        getDb()
          .prepare('INSERT INTO chat_messages (role, content, timestamp) VALUES (?, ?, ?)')
          .run('assistant', text, new Date().toISOString())
      }
    })
    .catch(() => {
      // Stream errored — surface happens client-side; nothing to persist.
    })

  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}

export async function GET() {
  const db = getDb()
  const history = db
    .prepare("SELECT role, content, timestamp FROM chat_messages WHERE session_id = 'default' ORDER BY id ASC LIMIT 200")
    .all()
  return Response.json({ success: true, data: history })
}
