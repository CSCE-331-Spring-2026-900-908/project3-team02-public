import { auth } from "@/auth"
import Link from "next/link"

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
        <div className="p-8 bg-white shadow-md rounded-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Not Signed In</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view this page.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="p-8 bg-white shadow-md rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Profile (Raw Data)</h1>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Back to Home
          </Link>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-md">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Session Object</h2>
            <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-4 rounded-md">
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{session.user?.name || "N/A"}</p>
            </div>
            <div className="border p-4 rounded-md">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{session.user?.email || "N/A"}</p>
            </div>
          </div>

          {session.user?.image && (
            <div className="border p-4 rounded-md flex items-center gap-4">
               <div>
                  <p className="text-sm text-gray-500">Profile Image URL</p>
                  <p className="text-xs break-all text-blue-600">{session.user.image}</p>
               </div>
               <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-12 h-12 rounded-full border"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
