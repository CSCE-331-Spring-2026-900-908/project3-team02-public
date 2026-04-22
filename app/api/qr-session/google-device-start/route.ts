import { createQRSession, setDeviceCode } from "@/lib/qr-sessions"
import QRCode from "qrcode"

export async function POST() {
  const clientId = process.env.AUTH_GOOGLE_ID
  if (!clientId) {
    return Response.json({ error: "Google OAuth not configured" }, { status: 500 })
  }

  let res: Response
  try {
    res = await fetch("https://oauth2.googleapis.com/device/code", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        scope: "openid email profile",
      }),
    })
  } catch {
    return Response.json({ error: "Cannot reach Google. Check server network connectivity." }, { status: 502 })
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message =
      err?.error === "unauthorized_client" || err?.error === "invalid_client"
        ? 'This Google OAuth client does not support Device Flow. In Google Cloud Console, create an OAuth client of type "Desktop app" or "TV and Limited Input devices" and set AUTH_GOOGLE_ID to that client\'s ID.'
        : (err?.error_description ?? err?.error ?? `Google responded with ${res.status}`)
    return Response.json({ error: message }, { status: 400 })
  }

  const data = await res.json()

  if (data.error) {
    const message =
      data.error === "unauthorized_client" || data.error === "invalid_client"
        ? 'This Google OAuth client does not support Device Flow. In Google Cloud Console, create an OAuth client of type "Desktop app" or "TV and Limited Input devices" and set AUTH_GOOGLE_ID to that client\'s ID.'
        : (data.error_description ?? data.error)
    return Response.json({ error: message }, { status: 400 })
  }

  // Google uses verification_url (not verification_uri)
  const {
    device_code,
    user_code,
    verification_url,
    expires_in,
    interval,
  } = data as {
    device_code: string
    user_code: string
    verification_url: string
    expires_in: number
    interval: number
  }

  const session = createQRSession()
  setDeviceCode(session.id, device_code, interval)

  // Google does not provide a pre-filled URL, so we link directly to the verification page
  const qrDataUrl = await QRCode.toDataURL(verification_url, {
    width: 200,
    margin: 2,
    color: { dark: "#1e293b", light: "#ffffff" },
  })

  return Response.json({
    sessionId: session.id,
    userCode: user_code,
    verificationUri: verification_url,
    qrDataUrl,
    expiresIn: expires_in,
    interval,
  })
}
