'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap,
  Bot,
  Search,
  BarChart3,
  TrendingUp,
  ClipboardList,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Zap },
  { href: '/agent', label: 'AI Agent', icon: Bot },
  { href: '/screener', label: 'Screener', icon: Search },
  { href: '/portfolio', label: 'Portfolio', icon: BarChart3 },
  { href: '/retirement', label: 'Retirement', icon: TrendingUp },
  { href: '/trades', label: 'Trades', icon: ClipboardList },
  { href: '/insurance', label: 'Insurance', icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-16 md:w-64 flex-col border-r border-[#1E1E1E] bg-surface shrink-0">
      <div className="flex items-center gap-3 px-3 md:px-5 py-5 border-b border-[#1E1E1E]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#C9A84C]/10 border border-[#C9A84C]/30">
          <span className="font-display font-bold text-sm text-[#C9A84C]">KW</span>
        </div>
        <span className="hidden md:block font-display text-sm font-semibold tracking-widest text-[#F5F5F5]">
          WEALTH AGENT
        </span>
      </div>

      <nav className="flex-1 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 md:px-5 py-2.5 text-sm font-body border-l-2 transition-colors',
                active
                  ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/5'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 md:px-5 py-4 border-t border-[#1E1E1E]">
        <span className="inline-flex items-center gap-1.5 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[10px] font-mono text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="hidden md:inline">PAPER MODE</span>
        </span>
      </div>
    </aside>
  )
}
