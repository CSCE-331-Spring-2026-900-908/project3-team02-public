"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Props {
  /** Where to push after successful sign-in. Ignored when onSuccess is provided. */
  redirectTo?: string
  /** Called after successful sign-in instead of navigating away. */
  onSuccess?: () => void
}

type Phase =
  | { tag: "loading" }
  | { tag: "ready"; sessionId: string; userCode: string; verificationUri: string; qrDataUrl: string; secondsLeft: number }
  | { tag: "authenticated" }
  | { tag: "expired" }
  | { tag: "denied" }
  | { tag: "error"; message: string }

export default function QRLoginSection({ redirectTo = "/manager/inventory", onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>({ tag: "loading" })
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  const stopTimers = () => {
    if (pollRef.current) clearTimeout(pollRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }

  const startPolling = useCallback(
    (sessionId: string, intervalSec: number) => {
      const scheduleNext = (nextSec: number) => {
        pollRef.current = setTimeout(async () => {
          try {
            const res = await fetch("/api/qr-session/google-device-poll", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            })
            const data: { status: string; interval?: number; sessionId?: string; message?: string } = await res.json()

            if (data.status === "authenticated" && data.sessionId) {
              stopTimers()
              setPhase({ tag: "authenticated" })
              const result = await signIn("qr-code", { sessionId: data.sessionId, redirect: false })
              if (result?.ok) {
                if (onSuccess) onSuccess()
                else router.push(redirectTo)
              } else {
                setPhase({ tag: "error", message: "Sign-in failed after authorization." })
              }
            } else if (data.status === "expired") {
              stopTimers(); setPhase({ tag: "expired" })
            } else if (data.status === "denied") {
              stopTimers(); setPhase({ tag: "denied" })
            } else if (data.status === "error") {
              stopTimers(); setPhase({ tag: "error", message: data.message ?? "Unknown error" })
            } else {
              scheduleNext(data.interval ?? nextSec)
            }
          } catch {
            scheduleNext(nextSec)
          }
        }, nextSec * 1000)
      }
      scheduleNext(intervalSec)
    },
    [router, redirectTo, onSuccess]
  )

  const start = useCallback(async () => {
    stopTimers()
    setPhase({ tag: "loading" })

    try {
      const res = await fetch("/api/qr-session/google-device-start", { method: "POST" })
      const data: {
        sessionId?: string; userCode?: string; verificationUri?: string
        qrDataUrl?: string; expiresIn?: number; interval?: number; error?: string
      } = await res.json()

      if (!res.ok || data.error) {
        setPhase({ tag: "error", message: data.error ?? "Failed to start sign-in" })
        return
      }

      const { sessionId, userCode, verificationUri, qrDataUrl, expiresIn = 900, interval = 5 } = data

      setPhase({
        tag: "ready",
        sessionId: sessionId!,
        userCode: userCode!,
        verificationUri: verificationUri!,
        qrDataUrl: qrDataUrl!,
        secondsLeft: expiresIn,
      })

      countdownRef.current = setInterval(() => {
        setPhase((prev) => {
          if (prev.tag !== "ready") return prev
          if (prev.secondsLeft <= 1) { stopTimers(); return { tag: "expired" } }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 }
        })
      }, 1000)

      startPolling(sessionId!, interval)
    } catch {
      setPhase({ tag: "error", message: "Network error — check your connection." })
    }
  }, [startPolling])

  useEffect(() => {
    start()
    return stopTimers
  }, [start])

  if (phase.tag === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="w-[200px] h-[200px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-8 w-36 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (phase.tag === "authenticated") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-600 font-semibold text-sm">Authorized — redirecting…</p>
      </div>
    )
  }

  if (phase.tag === "expired") {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-amber-600 text-sm">Code expired.</p>
        <button onClick={start} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          Generate new code
        </button>
      </div>
    )
  }

  if (phase.tag === "denied") {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-red-500 text-sm">Authorization denied on phone.</p>
        <button onClick={start} className="text-sm text-blue-600 underline">Try again</button>
      </div>
    )
  }

  if (phase.tag === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-red-500 text-sm text-center max-w-[280px]">{phase.message}</p>
        <button onClick={start} className="text-sm text-blue-600 underline">Try again</button>
      </div>
    )
  }

  const { userCode, verificationUri, qrDataUrl, secondsLeft } = phase
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const parts = userCode.includes("-") ? userCode.split("-") : [userCode]

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-gray-500 text-center">Scan with your phone — no shared Wi-Fi needed</p>

      <div className="relative p-1 rounded-xl border-2 border-gray-200">
        <img src={qrDataUrl} alt="Google device auth QR code" width={200} height={200} className="block rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-full p-1 shadow">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="w-full">
        <p className="text-xs text-gray-400 text-center mb-1.5">
          Or visit <span className="font-medium text-gray-600">{verificationUri}</span> and enter:
        </p>
        <div className="flex items-center justify-center gap-2">
          {parts.map((part, i) => (
            <span key={i} className="font-mono text-xl font-bold tracking-[0.2em] bg-gray-100 px-3 py-1.5 rounded-lg text-gray-800 select-all">
              {part}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Expires in {mins}:{secs.toString().padStart(2, "0")}
      </p>
    </div>
  )
}
