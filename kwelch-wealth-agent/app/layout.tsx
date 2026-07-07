import type { Metadata } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { ContentArea } from '@/components/layout/ContentArea'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'KWELCH WEALTH AGENT',
  description: 'Private wealth intelligence',
  icons: { icon: '/logo.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} bg-void text-[#F5F5F5] font-body`}
      >
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <ContentArea>{children}</ContentArea>
          </main>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-[#1E1E1E] px-6 py-1.5 text-[11px] text-[#9CA3AF] text-center z-50">
          KWELCH WEALTH AGENT is a personal research tool. All signals are informational only. Not licensed
          financial advice. Consult a registered fiduciary before trading with real capital.
        </div>
      </body>
    </html>
  )
}
