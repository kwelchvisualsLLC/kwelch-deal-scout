import { cn } from '@/lib/utils'
import { PhilosopherAvatar } from './PhilosopherAvatar'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export function MessageBubble({ role, content, streaming = false }: MessageBubbleProps) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] md:max-w-[70%] rounded-lg px-4 py-3 text-sm font-body whitespace-pre-wrap',
          isUser
            ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/25 text-[#F5F5F5]'
            : 'bg-surface border border-[#1E1E1E] text-[#F5F5F5]'
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-display text-[10px] font-bold tracking-widest text-[#C9A84C]">
              WEALTH AGENT
            </span>
            <PhilosopherAvatar content={content} />
          </div>
        )}
        {content}
        {streaming && <span className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom bg-[#C9A84C] animate-pulse" />}
      </div>
    </div>
  )
}
