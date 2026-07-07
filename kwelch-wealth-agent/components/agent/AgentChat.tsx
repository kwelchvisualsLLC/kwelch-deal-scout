'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SendHorizontal } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { QuickActions } from './QuickActions'
import { Spinner } from '@/components/ui/Spinner'
import type { ChatMessage } from '@/types'

interface StreamEvent {
  type: string
  delta?: { type: string; text?: string }
}

export function AgentChat() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoSentRef = useRef(false)

  useEffect(() => {
    fetch('/api/agent')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMessages(json.data)
      })
      .catch(() => undefined)
      .finally(() => setHistoryLoaded(true))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setError(null)
      setLoading(true)
      setInput('')

      const userMessage: ChatMessage = {
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setStreamingText('')

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => null)
          throw new Error(json?.error || `Agent request failed (${res.status})`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let assistantText = ''

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue
            try {
              const event = JSON.parse(trimmedLine) as StreamEvent
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                assistantText += event.delta.text ?? ''
                setStreamingText(assistantText)
              }
            } catch {
              // Ignore malformed lines (partial JSON is handled by the buffer)
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: assistantText || '(no response)', timestamp: new Date().toISOString() },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'The agent is unavailable right now.')
      } finally {
        setStreamingText(null)
        setLoading(false)
      }
    },
    [loading, messages]
  )

  // Support /agent?prompt=... deep links from other pages
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt && historyLoaded && !autoSentRef.current) {
      autoSentRef.current = true
      send(prompt)
    }
  }, [searchParams, historyLoaded, send])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {!historyLoaded && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        )}
        {historyLoaded && messages.length === 0 && (
          <p className="text-center text-sm font-body text-[#9CA3AF] py-10">
            Start the conversation — ask about your portfolio, a ticker, or your retirement plan.
          </p>
        )}
        {messages.map((message, i) => (
          <MessageBubble key={i} role={message.role} content={message.content} />
        ))}
        {streamingText !== null && (
          <MessageBubble role="assistant" content={streamingText} streaming />
        )}
        {error && (
          <p className="text-center text-xs font-mono text-[#C0392B]">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#1E1E1E] bg-surface px-4 md:px-8 py-4 space-y-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ask the wealth agent… (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none rounded-md bg-[#1A1A1A] border border-[#1E1E1E] px-3 py-2 text-sm font-body text-[#F5F5F5] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#C9A84C]/60"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="rounded-md bg-[#C9A84C] p-2.5 text-[#0A0A0A] hover:bg-[#C9A84C]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Spinner size="sm" className="border-[#0A0A0A]/30 border-t-[#0A0A0A]" /> : <SendHorizontal className="h-4 w-4" />}
          </button>
        </div>
        <QuickActions onAction={send} disabled={loading} />
      </div>
    </div>
  )
}
