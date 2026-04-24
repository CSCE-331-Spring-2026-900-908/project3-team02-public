import { getQRSession } from "@/lib/qr-sessions"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // controller already closed
        }
      }

      const session = getQRSession(sessionId)
      if (!session) {
        send({ status: "invalid" })
        controller.close()
        return
      }

      // Send initial heartbeat immediately
      send({ status: "pending" })

      let attempts = 0
      const maxAttempts = 300 // 5 minutes at 1s intervals

      const poll = setInterval(() => {
        attempts++
        const s = getQRSession(sessionId)

        if (!s || s.status === "expired" || attempts >= maxAttempts) {
          send({ status: "expired" })
          clearInterval(poll)
          controller.close()
          return
        }

        if (s.status === "consumed") {
          // Already consumed by another tab — treat as expired
          send({ status: "expired" })
          clearInterval(poll)
          controller.close()
          return
        }

        if (s.status === "authenticated") {
          send({ status: "authenticated", sessionId })
          clearInterval(poll)
          controller.close()
          return
        }

        // Heartbeat every 30 seconds to keep connection alive
        if (attempts % 30 === 0) {
          send({ status: "pending" })
        }
      }, 1000)

      request.signal.addEventListener("abort", () => {
        clearInterval(poll)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
