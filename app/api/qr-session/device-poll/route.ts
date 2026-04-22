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
    res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.AUTH_GITHUB_ID,
        device_code: session.deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    })
  } catch {
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
    return Response.json({ status: "error", message: "Unexpected GitHub response" })
  }

  let userRes: Response
  try {
    userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        Accept: "application/vnd.github+json",
      },
    })
  } catch {
    return Response.json({ status: "error", message: "Could not fetch GitHub profile" })
  }

  const userData = await userRes.json()
  let email: string | null = userData.email ?? null

  if (!email) {
    try {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: "application/vnd.github+json",
        },
      })
      const emails: { email: string; primary: boolean; verified: boolean }[] = await emailRes.json()
      email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email ?? null
    } catch { /* leave email null */ }
  }

  completeQRSession(sessionId, {
    name: userData.name ?? userData.login ?? null,
    email,
    image: userData.avatar_url ?? null,
  })

  return Response.json({ status: "authenticated", sessionId })
}
