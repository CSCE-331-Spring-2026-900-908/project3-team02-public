import { randomUUID } from 'crypto'

export type QueueEntry = {
  id: string
  saleId: number
  summary: string
  minutesTotal: number
  addedAt: Date
  expiresAt: Date
}

type ItemForQueue = {
  itemName: string
  qty: number
  category: string
  customizations?: string
}

// Survive HMR in development
const g = globalThis as typeof globalThis & { _orderQueue?: Map<string, QueueEntry> }
const queue: Map<string, QueueEntry> = g._orderQueue ?? (g._orderQueue = new Map())

// Base prep times in minutes per item unit, by category
const CATEGORY_BASE_TIMES: Record<string, number> = {
  snack: 2,
  'fruit tea': 3,
  refresher: 3,
  slush: 4,
  'milk tea': 5,
  specialty: 6,
}

function baseTimeForCategory(category: string): number {
  return CATEGORY_BASE_TIMES[category.toLowerCase()] ?? 4
}

export function calculateQueueMinutes(items: ItemForQueue[]): number {
  let total = 0

  for (const item of items) {
    const base = baseTimeForCategory(item.category)
    let itemTime = base * item.qty

    // Extra boba takes longer to cook/prepare
    if (item.customizations?.toLowerCase().includes('extra boba')) {
      itemTime += item.qty
    }
    // Large size means more to prepare
    if (item.customizations?.toLowerCase().includes('large')) {
      itemTime += item.qty
    }

    total += itemTime
  }

  const totalQty = items.reduce((s, i) => s + i.qty, 0)

  // Batch discount: making multiple drinks at once is faster than sequential
  if (totalQty > 1) {
    total = Math.ceil(total * 0.65)
  }

  return Math.max(1, total)
}

export function addToQueue(saleId: number, items: ItemForQueue[]): QueueEntry {
  const id = randomUUID()
  const minutesTotal = calculateQueueMinutes(items)
  const addedAt = new Date()
  const expiresAt = new Date(addedAt.getTime() + minutesTotal * 60 * 1000)

  const summary = items.map(i => `${i.qty}x ${i.itemName}`).join(', ')

  const entry: QueueEntry = { id, saleId, summary, minutesTotal, addedAt, expiresAt }
  queue.set(id, entry)

  setTimeout(() => {
    queue.delete(id)
  }, minutesTotal * 60 * 1000)

  return entry
}

export function getQueue(): QueueEntry[] {
  return Array.from(queue.values()).sort(
    (a, b) => a.addedAt.getTime() - b.addedAt.getTime()
  )
}
