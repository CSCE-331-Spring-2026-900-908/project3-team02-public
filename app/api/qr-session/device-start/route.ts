import { createQRSession, setDeviceCode } from "@/lib/qr-sessions"
import QRCode from "qrcode"

export async function POST() {
  const clientId = process.env.AUTH_GITHUB_ID
  if (!clientId) {
    return Response.json({ error: "GitHub OAuth not configured" }, { status: 500 })
  }

  let res: Response
  try {
    res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, scope: "read:user user:email" }),
    })
  } catch {
    return Response.json({ error: "Cannot reach GitHub. Check server network connectivity." }, { status: 502 })
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.error) {
    const raw = data.error as string | undefined
    let message: string
    if (raw === "unauthorized_client") {
      message = 'Device Flow is not enabled. Open your GitHub OAuth App settings and check "Enable Device Flow".'
    } else if (raw === "Not Found" || res.status === 404) {
      message = "GitHub OAuth App not found. Verify AUTH_GITHUB_ID in your .env."
    } else {
      message = data.error_description ?? raw ?? `GitHub responded with ${res.status}`
    }
    return Response.json({ error: message }, { status: 400 })
  }

  const {
    device_code,
    user_code,
    verification_uri,
    verification_uri_complete,
    expires_in,
    interval,
  } = data as {
    device_code: string
    user_code: string
    verification_uri: string
    verification_uri_complete?: string
    expires_in: number
    interval: number
  }

  const session = createQRSession()
  setDeviceCode(session.id, device_code, interval)

  const qrTarget = verification_uri_complete ?? `${verification_uri}?code=${user_code}`
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    width: 200,
    margin: 2,
    color: { dark: "#1e293b", light: "#ffffff" },
  })

  return Response.json({
    sessionId: session.id,
    userCode: user_code,
    verificationUri: verification_uri,
    qrDataUrl,
    expiresIn: expires_in,
    interval,
  })
}
