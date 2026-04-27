import { NextResponse } from 'next/server'
import { getQueue } from '@/lib/queue'

export async function GET() {
  const now = Date.now()
  const entries = getQueue().map(entry => ({
    id: entry.id,
    saleId: entry.saleId,
    summary: entry.summary,
    minutesTotal: entry.minutesTotal,
    minutesRemaining: Math.max(0, Math.ceil((entry.expiresAt.getTime() - now) / 60000)),
  }))
  return NextResponse.json(entries)
}
