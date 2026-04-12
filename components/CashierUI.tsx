'use client'

import { useState } from 'react'

export interface MenuItem {
  id: number
  name: string
  price: number
  category: string
}

export interface OrderItem {
  itemId: number
  itemName: string
  price: number
  qty: number
}

const CATEGORIES = ['All', 'Milk Tea', 'Fruit Tea', 'Slush', 'Special']

const MENU_ITEMS: MenuItem[] = [
  { id: 1,  name: 'Classic Milk Tea',     price: 5.50, category: 'Milk Tea'  },
  { id: 2,  name: 'Taro Milk Tea',        price: 6.25, category: 'Milk Tea'  },
  { id: 3,  name: 'Brown Sugar Milk Tea', price: 6.75, category: 'Milk Tea'  },
  { id: 4,  name: 'Matcha Milk Tea',      price: 6.50, category: 'Milk Tea'  },
  { id: 5,  name: 'Passion Fruit Tea',    price: 5.75, category: 'Fruit Tea' },
  { id: 6,  name: 'Lychee Tea',           price: 5.75, category: 'Fruit Tea' },
  { id: 7,  name: 'Strawberry Tea',       price: 5.75, category: 'Fruit Tea' },
  { id: 8,  name: 'Peach Tea',            price: 5.50, category: 'Fruit Tea' },
  { id: 9,  name: 'Mango Slush',          price: 6.00, category: 'Slush'     },
  { id: 10, name: 'Strawberry Slush',     price: 6.00, category: 'Slush'     },
  { id: 11, name: 'Taro Slush',           price: 6.25, category: 'Slush'     },
  { id: 12, name: 'Tiger Sugar Latte',    price: 7.00, category: 'Special'   },
  { id: 13, name: 'Oreo Smoothie',        price: 7.25, category: 'Special'   },
  { id: 14, name: 'Cheese Foam Tea',      price: 7.50, category: 'Special'   },
]

export default function CashierUI() {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [paymentType, setPaymentType] = useState<'Card' | 'Cash'>('Card')
  const [submitted, setSubmitted] = useState(false)

  const visibleItems =
    activeCategory === 'All'
      ? MENU_ITEMS
      : MENU_ITEMS.filter(item => item.category === activeCategory)

  const orderTotal = cart.reduce((sum, o) => sum + o.price * o.qty, 0)

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(o => o.itemId === item.id)
      if (existing) {
        return prev.map(o =>
          o.itemId === item.id ? { ...o, qty: o.qty + 1 } : o
        )
      }
      return [...prev, { itemId: item.id, itemName: item.name, price: item.price, qty: 1 }]
    })
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
    // Implement actual fetch POST to API in a future sprint
    const summary = cart.map(o => `${o.itemName} x${o.qty}`).join(', ')
    alert(`Order submitted!\n${summary}\nPayment: ${paymentType}\nTotal: $${orderTotal.toFixed(2)}`)
    setCart([])
    setPaymentType('Card')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  // Returns ONLY the two-column grid. The outer pages dictate headers.
  return (
    <div className="flex h-full w-full bg-white font-sans">
      {/* Left panel: Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Category filter bar */}
        <div className="px-6 py-3 flex gap-2 border-b border-gray-100 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={
                activeCategory === cat
                  ? 'px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium whitespace-nowrap'
                  : 'px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium whitespace-nowrap hover:bg-gray-200'
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            {visibleItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-left
                           hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <p className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</p>
                <p className="mt-1 text-blue-600 font-bold">${item.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar: Cart */}
      <aside className="w-80 border-l border-gray-200 flex flex-col bg-gray-50">
        <div className="px-4 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Current Order</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-8">No items added</p>
          ) : (
            cart.map(item => (
              <div
                key={item.itemId}
                className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 py-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.itemName}</p>
                  <p className="text-gray-500">
                    x{item.qty} &middot; ${(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.itemId)}
                  className="ml-2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none cursor-pointer"
                >
                  &minus;
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 space-y-3">
          {submitted && (
            <div className="rounded-lg bg-green-100 border border-green-300 text-green-800 text-sm px-3 py-2 text-center font-medium">
              Order placed successfully!
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment</p>
            <div className="flex gap-4">
              {(['Card', 'Cash'] as const).map(type => (
                <label key={type} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="payment"
                    value={type}
                    checked={paymentType === type}
                    onChange={() => setPaymentType(type)}
                    className="accent-blue-600"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-sm font-semibold text-gray-800">
            <span>Total</span>
            <span>${orderTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={submitOrder}
            disabled={cart.length === 0}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm
                       hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Submit Order
          </button>
        </div>
      </aside>
    </div>
  )
}