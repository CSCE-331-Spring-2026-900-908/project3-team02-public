'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MenuItem {
  itemid: number
  itemname: string
  price: number
  category: string
  description: string
}

interface OrderItem {
  itemId: number
  itemName: string
  price: number
  qty: number
}

export default function KioskPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<OrderItem[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [addedNotification, setAddedNotification] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch('/api/items')
        const data = await response.json()
        // Convert price to number since database returns it as string
        setItems(data.map((item: any) => ({ ...item, price: Number(item.price) })))
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  // Google Translate widget
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="translate_a/element.js"]')
    
    // Define the initialization function
    ;(window as any).googleTranslateElementInit = function () {
      if ((window as any).google?.translate?.TranslateElement) {
        // Clear existing translate elements to prevent duplicates
        const container = document.getElementById('google_translate_element')
        if (container) {
          container.innerHTML = ''
        }
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: 'en' },
          'google_translate_element'
        )
      }
    }

    // If script doesn't exist, create and append it
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.head.appendChild(script)
    } else if ((window as any).google?.translate?.TranslateElement) {
      // Script exists and is loaded, initialize immediately
      ;(window as any).googleTranslateElementInit()
    }

    return () => {
      // Don't remove the script - let it persist for navigation
    }
  }, [])

  const categories = Array.from(new Set(items.map(i => i.category))).filter(c => c && c.trim())
  const visibleItems = selectedCategory ? items.filter(i => i.category === selectedCategory) : []
  const orderTotal = cart.reduce((sum, o) => sum + o.price * o.qty, 0)

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(o => o.itemId === item.itemid)
      if (existing) {
        return prev.map(o =>
          o.itemId === item.itemid ? { ...o, qty: o.qty + 1 } : o
        )
      }
      return [...prev, { itemId: item.itemid, itemName: item.itemname, price: item.price, qty: 1 }]
    })
    // Show notification
    setAddedNotification(item.itemname)
    //setSelectedCategory(null) // removing auto redirect according to user study feedback
    setTimeout(() => setAddedNotification(null), 2000)
  }

  function incrementCart(itemId: number) {
    setCart(prev =>
      prev.map(o => (o.itemId === itemId ? { ...o, qty: o.qty + 1 } : o))
    )
  }

  function removeFromCart(itemId: number) {
    setCart(prev =>
      prev
        .map(o => (o.itemId === itemId ? { ...o, qty: o.qty - 1 } : o))
        .filter(o => o.qty > 0)
    )
  }

  function submitOrder() {
    if (cart.length === 0) return
    const summary = cart.map(o => `${o.itemName} x${o.qty}`).join(', ')
    alert(`Order submitted!\n${summary}\nTotal: $${orderTotal.toFixed(2)}`)
    setCart([])
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="flex h-screen bg-white font-sans">
      {/* Notification popup */}
      {addedNotification && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-semibold text-center">
            ✓ {addedNotification} added to cart!
          </div>
        </div>
      )}
      {/* Left panel - Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-2xl font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                ←
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedCategory ? selectedCategory : 'Order Kiosk'}
            </h1>
          </div>
          <div id="google_translate_element" suppressHydrationWarning></div>
        </header>

        {/* Menu grid - Show categories or items */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 font-medium">Loading menu...</p>
            </div>
          ) : !selectedCategory ? (
            // Show categories
            <div className="grid grid-cols-3 gap-6">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 p-6 text-left
                             hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <p className="font-bold text-gray-900 text-2xl leading-snug">{cat}</p>
                  <p className="mt-3 text-gray-500 text-sm">{items.filter(i => i.category === cat).length} items</p>
                </button>
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 font-medium">No items available</p>
            </div>
          ) : (
            // Show items for selected category
            <div className="grid grid-cols-3 gap-6">
              {visibleItems.map(item => (
                <button
                  key={item.itemid}
                  onClick={() => addToCart(item)}
                  className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 p-6 text-left
                             hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <p className="font-bold text-gray-900 text-lg leading-snug">{item.itemname}</p>
                  {item.description && (
                    <p className="mt-2 text-gray-600 text-sm line-clamp-2">{item.description}</p>
                  )}
                  <p className="mt-3 text-blue-600 font-bold text-xl">${item.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Cart */}
      <div className="w-96 border-l border-gray-200 flex flex-col bg-gray-50">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-800 text-lg">Your Order</h2>
        </header>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-12 font-medium">No items selected</p>
          ) : (
            cart.map(item => (
              <div
                key={item.itemId}
                className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{item.itemName}</p>
                  <p className="text-sm text-gray-500">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => removeFromCart(item.itemId)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200 font-bold text-sm cursor-pointer transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-800">{item.qty}</span>
                  <button
                    onClick={() => incrementCart(item.itemId)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-green-100 text-green-600 hover:bg-green-200 font-bold text-sm cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Total and buttons */}
        <div className="px-6 py-5 border-t border-gray-200 space-y-4">
          {submitted && (
            <div className="rounded-lg bg-green-100 border border-green-300 text-green-800 text-sm px-4 py-3 text-center font-semibold">
              Order placed successfully!
            </div>
          )}

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="text-gray-800">${orderTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-blue-600">${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={submitOrder}
            disabled={cart.length === 0}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg
                       hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md"
          >
            Complete Order
          </button>

          <button
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="w-full py-2 rounded-lg bg-gray-200 text-gray-700 font-medium text-sm
                       hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}