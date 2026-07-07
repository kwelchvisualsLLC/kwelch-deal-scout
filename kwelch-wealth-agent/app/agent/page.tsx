import { Suspense } from 'react'
import { AgentChat } from '@/components/agent/AgentChat'
import { Spinner } from '@/components/ui/Spinner'

export default function AgentPage() {
  return (
    <div className="h-full pb-8">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
      >
        <AgentChat />
      </Suspense>
    </div>
  )
}
