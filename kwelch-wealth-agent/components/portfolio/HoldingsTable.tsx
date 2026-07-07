import { cn, formatCurrency, formatPct } from '@/lib/utils'

export interface HoldingRowData {
  ticker: string
  shares: number
  avgCost: number
  currentPrice: number
  marketValue: number
  pnl: number
  pnlPct: number
}

interface HoldingsTableProps {
  rows: HoldingRowData[]
  emptyMessage?: string
}

export function HoldingsTable({ rows, emptyMessage = 'No holdings yet.' }: HoldingsTableProps) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm font-body text-[#9CA3AF]">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1E1E1E] text-left text-[10px] font-body uppercase tracking-wider text-[#9CA3AF]">
            <th className="py-2 pr-3">Ticker</th>
            <th className="py-2 px-3 text-right">Shares</th>
            <th className="py-2 px-3 text-right">Avg Cost</th>
            <th className="py-2 px-3 text-right">Current</th>
            <th className="py-2 px-3 text-right">Value</th>
            <th className="py-2 px-3 text-right">P&amp;L</th>
            <th className="py-2 pl-3 text-right">P&amp;L%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ticker} className="border-b border-[#1E1E1E]/60 hover:bg-[#1A1A1A] transition-colors">
              <td className="py-2.5 pr-3 font-display font-semibold text-[#F5F5F5]">{row.ticker}</td>
              <td className="py-2.5 px-3 text-right font-mono text-[#F5F5F5]">{row.shares}</td>
              <td className="py-2.5 px-3 text-right font-mono text-[#9CA3AF]">{formatCurrency(row.avgCost)}</td>
              <td className="py-2.5 px-3 text-right font-mono text-[#F5F5F5]">{formatCurrency(row.currentPrice)}</td>
              <td className="py-2.5 px-3 text-right font-mono text-[#F5F5F5]">{formatCurrency(row.marketValue)}</td>
              <td className={cn('py-2.5 px-3 text-right font-mono', row.pnl >= 0 ? 'text-[#27AE60]' : 'text-[#C0392B]')}>
                {formatCurrency(row.pnl)}
              </td>
              <td className={cn('py-2.5 pl-3 text-right font-mono', row.pnlPct >= 0 ? 'text-[#27AE60]' : 'text-[#C0392B]')}>
                {formatPct(row.pnlPct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
