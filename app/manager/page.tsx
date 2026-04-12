'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ManagerLoginPage() {
  const [pin, setPin] = useState('')
  const router = useRouter()

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Placeholder PIN logic
    if (pin === '1234') {
      // Save auth state to the browser session
      sessionStorage.setItem('managerAuth', 'true')
      // Redirect into the protected dashboard area
      router.push('/manager/inventory')
    } else {
      alert('Invalid Manager PIN. Please try again.')
      setPin('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Manager Authorization</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Please enter your manager PIN to unlock the terminal.
        </p>

        <form onSubmit={handleAuth} className="w-full space-y-6">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN (e.g., 1234)"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg tracking-widest text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Unlock Terminal
          </button>
        </form>
      </div>
    </div>
  )
}