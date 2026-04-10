'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function BaseviewTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Check if the manager is logged in via session storage
    const auth = sessionStorage.getItem('managerAuth')
    if (!auth) {
      // Kick them back to the login PIN screen if not authorized
      router.replace('/manager')
    } else {
      setIsAuthorized(true)
    }
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('managerAuth')
    router.push('/') // Navigate back to the main terminal login
  }

  // Prevent flashing the sidebar before the redirect happens
  if (!isAuthorized) return null

  // Helper to extract a clean title from the URL (e.g., /manager/menu-edit -> Menu Edit)
  const getPageTitle = () => {
    const path = pathname.split('/').pop() || 'Dashboard'
    return path.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Manager View</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavLink href="/manager/inventory" label="Inventory" current={pathname} />
          <NavLink href="/manager/menu-edit" label="Menu Edit" current={pathname} />
          <NavLink href="/manager/employees" label="Employees" current={pathname} />
          <NavLink href="/manager/orders" label="Orders History" current={pathname} />
          <NavLink href="/manager/product-usage" label="Product Usage" current={pathname} />
          <NavLink href="/manager/reports" label="Generate Reports" current={pathname} />
          <NavLink href="/manager/cashier" label="Cashier Terminal" current={pathname} />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full py-2 px-4 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors cursor-pointer"
          >
            Logout / Exit
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-semibold text-gray-800">{getPageTitle()}</h2>
        </header>
        
        {/* The active page content renders here */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, label, current }: { href: string, label: string, current: string }) {
  // Use exact matching to prevent multiple links from highlighting if paths overlap
  const isActive = current === href
  
  return (
    <Link
      href={href}
      className={`w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )
}