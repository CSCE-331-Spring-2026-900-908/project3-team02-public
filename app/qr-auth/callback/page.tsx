import { auth } from "@/auth"
import { completeQRSession } from "@/lib/qr-sessions"

export default async function QRCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const { session: sessionId } = await searchParams
  const authSession = await auth()

  if (!sessionId || !authSession?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <p className="text-red-500 font-medium">Authentication failed. Please try scanning the QR code again.</p>
        </div>
      </div>
    )
  }

  const success = completeQRSession(sessionId, {
    name: authSession.user.name ?? null,
    email: authSession.user.email ?? null,
    image: authSession.user.image ?? null,
  })

  if (!success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <p className="text-amber-500 font-medium">Session expired or already used. Please scan a new QR code.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Authorization Successful</h1>
        <p className="text-gray-500 text-sm">
          Signed in as <span className="font-medium text-gray-700">{authSession.user.email}</span>
        </p>
        <p className="text-gray-400 text-sm mt-3">The POS screen is now logged in. You can close this page.</p>
      </div>
    </div>
  )
}
