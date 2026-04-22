import { randomUUID } from 'crypto'

export type QRSessionStatus = 'pending' | 'authenticated' | 'consumed' | 'expired'

export type QRSessionUser = {
  name: string | null
  email: string | null
  image: string | null
}

export type QRSession = {
  id: string
  status: QRSessionStatus
  user?: QRSessionUser
  createdAt: Date
  deviceCode?: string
  devicePollInterval?: number
}

// Survive HMR in development
const g = globalThis as typeof globalThis & { _qrSessions?: Map<string, QRSession> }
const sessions: Map<string, QRSession> = g._qrSessions ?? (g._qrSessions = new Map())

const SESSION_TTL_MS = 5 * 60 * 1000

export function createQRSession(): QRSession {
  const id = randomUUID()
  const session: QRSession = { id, status: 'pending', createdAt: new Date() }
  sessions.set(id, session)

  setTimeout(() => {
    const s = sessions.get(id)
    if (s && s.status === 'pending') s.status = 'expired'
  }, SESSION_TTL_MS)

  return session
}

export function getQRSession(id: string): QRSession | undefined {
  return sessions.get(id)
}

export function setDeviceCode(id: string, deviceCode: string, interval: number): void {
  const session = sessions.get(id)
  if (session) {
    session.deviceCode = deviceCode
    session.devicePollInterval = interval
  }
}

export function updatePollInterval(id: string, interval: number): void {
  const session = sessions.get(id)
  if (session) session.devicePollInterval = interval
}

export function completeQRSession(id: string, user: QRSessionUser): boolean {
  const session = sessions.get(id)
  if (!session || session.status !== 'pending') return false
  session.status = 'authenticated'
  session.user = user
  return true
}

export function consumeQRSession(id: string): QRSessionUser | null {
  const session = sessions.get(id)
  if (!session || session.status !== 'authenticated' || !session.user) return null
  session.status = 'consumed'
  return session.user
}
