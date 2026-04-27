import { getQRSession, updatePollInterval, completeQRSession } from "@/lib/qr-sessions"

export async function POST(request: Request) {
  const { sessionId } = await request.json()

  if (!sessionId) {
    return Response.json({ status: "error", message: "Missing sessionId" }, { status: 400 })
  }

  const session = getQRSession(sessionId)

  if (!session || session.status === "expired") return Response.json({ status: "expired" })
  if (session.status === "authenticated" || session.status === "consumed") {
    return Response.json({ status: "authenticated", sessionId })
  }
  if (!session.deviceCode) {
    return Response.json({ status: "error", message: "No device code" }, { status: 400 })
  }

  let res: Response
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        device_code: session.deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    })
  } catch {
    // Network error — keep polling
    return Response.json({ status: "pending", interval: session.devicePollInterval ?? 5 })
  }

  const data = await res.json()

  if (data.error) {
    switch (data.error) {
      case "authorization_pending":
        return Response.json({ status: "pending", interval: session.devicePollInterval ?? 5 })
      case "slow_down": {
        const newInterval = (session.devicePollInterval ?? 5) + 5
        updatePollInterval(sessionId, newInterval)
        return Response.json({ status: "pending", interval: newInterval })
      }
      case "expired_token":
        return Response.json({ status: "expired" })
      case "access_denied":
        return Response.json({ status: "denied" })
      default:
        return Response.json({ status: "error", message: data.error_description ?? data.error })
    }
  }

  if (!data.access_token) {
    return Response.json({ status: "error", message: "Unexpected Google response" })
  }

  let userRes: Response
  try {
    userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
  } catch {
    return Response.json({ status: "error", message: "Could not fetch Google profile" })
  }

  const userData = await userRes.json()

  completeQRSession(sessionId, {
    name: userData.name ?? null,
    email: userData.email ?? null,
    image: userData.picture ?? null,
  })

  return Response.json({ status: "authenticated", sessionId })
}
