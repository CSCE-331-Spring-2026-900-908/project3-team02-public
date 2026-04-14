'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface BaseviewTemplateProps {
  children: React.ReactNode
  userEmail?: string | null
}

export default function BaseviewTemplate({ children, userEmail }: BaseviewTemplateProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    const path = pathname.split('/').pop() || ''
    return path.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Manager View</h1>
          {userEmail && <p className="text-xs text-gray-500 mt-1 truncate">{userEmail}</p>}
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavLink href="/manager/inventory" label="Inventory" current={pathname} />
          <NavLink href="/manager/menu-edit" label="Menu Edit" current={pathname} />
          <NavLink href="/manager/employees" label="Employees" current={pathname} />
          <NavLink href="/manager/orders" label="Orders History" current={pathname} />
          <NavLink href="/manager/product-usage" label="Product Usage" current={pathname} />
          <NavLink href="/manager/reports" label="Generate Reports" current={pathname} />
          {/* New Cashier Terminal Link */}
          <NavLink href="/manager/cashier" label="Cashier Terminal" current={pathname} />
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center justify-center w-full py-2 px-4 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Logout / Exit
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 capitalize">{getPageTitle()}</h2>
        </header>
        
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, label, current }: { href: string, label: string, current: string }) {
  const isActive = current.startsWith(href)
  
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