import Link from 'next/link'
import CashierUI from '@/components/CashierUI'

export default function EmployeeCashierPage() {
  return (
    <div className="flex flex-col h-screen w-full bg-white font-sans">
      
      {/* Top Navigation Bar */}
      <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white z-10 relative">
        <h1 className="text-xl font-semibold text-gray-900">Standard Register</h1>
        
        {/* Simple text link to go back */}
        <Link 
          href="/" 
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          &larr; Back
        </Link>
      </header>

      {/* Main Cashier UI Component */}
      <main className="flex-1 overflow-hidden relative">
        <CashierUI />
      </main>

    </div>
  )
}