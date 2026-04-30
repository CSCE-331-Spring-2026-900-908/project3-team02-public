"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

export default function PinLoginForm() {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await signIn("demo-pin", {
      pin,
      redirect: false,
    })
    setLoading(false)
    if (result?.ok) {
      window.location.href = "/manager/inventory"
    } else {
      setError("Incorrect PIN")
      setPin("")
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center mb-4">
        <div className="flex-1 border-t border-gray-200" />
        <span className="mx-3 text-xs text-gray-400">or enter employee PIN</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            placeholder="Employee PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
            autoComplete="off"
            required
          />
          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "Enter"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
        )}
      </form>
    </div>
  )
}
