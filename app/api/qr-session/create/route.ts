import { createQRSession } from "@/lib/qr-sessions"
import QRCode from "qrcode"

export async function POST(request: Request) {
  const session = createQRSession()

  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`
  const qrUrl = `${baseUrl}/qr-auth?session=${session.id}`

  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 256,
    margin: 2,
    color: { dark: "#1e293b", light: "#ffffff" },
  })

  return Response.json({ sessionId: session.id, qrDataUrl, qrUrl })
}
