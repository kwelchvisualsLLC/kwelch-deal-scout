import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function fail(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status })
}

// Simple in-memory sliding-window rate limiter (per-process)
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, maxPerMinute: number): boolean {
  const now = Date.now()
  const windowStart = now - 60_000
  const hits = (buckets.get(key) || []).filter((t) => t > windowStart)
  if (hits.length >= maxPerMinute) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  return true
}
