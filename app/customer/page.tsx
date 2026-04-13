'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MenuItem, OrderItem } from './types'
import { MENU_ITEMS } from '../data/menu'
import ChatWidget from './ChatWidget'

export default function KioskPage() {
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<OrderItem[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [addedNotification, setAddedNotification] = useState<string | null>(null)

  // Customization states
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const [drinkSize, setDrinkSize] = useState('Medium')
  const [iceLevel, setIceLevel] = useState('Normal Ice')
  const [sugarLevel, setSugarLevel] = useState('100% Sugar')
  const [bobaOption, setBobaOption] = useState<'Regular Boba' | 'Extra Boba' | 'No Boba'>('Regular Boba')

  // Add these with your other state declarations
  const [weather, setWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  // Items from DB (falls back to hardcoded MENU_ITEMS on failure)
  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch('/api/items')
        if (!response.ok) return
        const rows = await response.json()
        if (!Array.isArray(rows) || rows.length === 0) return
        const normalized: MenuItem[] = rows
          .filter((r: any) => r.isactive !== false)
          .map((r: any) => ({
            itemid: r.itemid,
            itemname: r.itemname,
            price: Number(r.price),
            category: r.category,
            description: r.description ?? '',
          }))
        setItems(normalized)
      } catch (error) {
        console.error('Error fetching items, using hardcoded fallback:', error)
      }
    }
    fetchItems()
  }, [])

  // Weather API
  useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch('/api/weather')
        const data = await response.json()
        setWeather(data)
      } catch (error) {
        console.error('Error fetching weather:', error)
      } finally {
        setWeatherLoading(false)
      }
    }
    fetchWeather()
  }, [])

  // Google Translate widget
  useEffect(() => {
    // Define the initialization function
    ;(window as any).googleTranslateElementInit = function () {
      if ((window as any).google?.translate?.TranslateElement) {
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: 'en', layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE }, 
          'google_translate_element'
        )
      }
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="translate_a/element.js"]')
    
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    } else {
      // Script already loaded, try to initialize
      setTimeout(() => {
        if ((window as any).google?.translate?.TranslateElement) {
          ;(window as any).googleTranslateElementInit()
        }
      }, 100)
    }

    return () => {
    }
  }, [])

  const categories = Array.from(new Set(items.map(i => i.category))).filter(c => c && c.trim())
  const visibleItems = selectedCategory ? items.filter(i => i.category === selectedCategory) : []
  const orderTotal = cart.reduce((sum, o) => sum + o.price * o.qty, 0)

  function openCustomization(item: MenuItem) {
    setCustomizingItem(item)
    setDrinkSize('Medium')
    setIceLevel('Normal Ice')
    setSugarLevel('100% Sugar')
    setBobaOption('Regular Boba')
  }

  function confirmCustomization() {
    if (!customizingItem) return
    
    const customString = `${drinkSize}, ${iceLevel}, ${sugarLevel}, ${bobaOption}`
    const cartId = `${customizingItem.itemid}-${customString}`

    setCart(prev => {
      const existing = prev.find(o => o.cartId === cartId)
      if (existing) {
        return prev.map(o =>
          o.cartId === cartId ? { ...o, qty: o.qty + 1 } : o
        )
      }
      return [...prev, { 
        itemId: customizingItem.itemid, 
        itemName: customizingItem.itemname, 
        price: customizingItem.price, 
        qty: 1,
        customizations: customString,
        cartId
      }]
    })

    setAddedNotification(customizingItem.itemname)
    setTimeout(() => setAddedNotification(null), 2000)
    setCustomizingItem(null)
  }

  const DEFAULT_CUSTOM_STRING = 'Medium, Normal Ice, 100% Sugar, Regular Boba'

  function addToCartFromChat(item: MenuItem): string {
    const customString = DEFAULT_CUSTOM_STRING
    const cartId = `${item.itemid}-${customString}`
    setCart(prev => {
      const existing = prev.find(o => o.cartId === cartId)
      if (existing) {
        return prev.map(o => (o.cartId === cartId ? { ...o, qty: o.qty + 1 } : o))
      }
      return [
        ...prev,
        {
          itemId: item.itemid,
          itemName: item.itemname,
          price: item.price,
          qty: 1,
          customizations: customString,
          cartId,
        },
      ]
    })
    setAddedNotification(item.itemname)
    setTimeout(() => setAddedNotification(null), 2000)
    return cartId
  }

  function modifyChatCartLine(oldCartId: string, newCustomString: string): string | null {
    let newCartId: string | null = null
    setCart(prev => {
      const line = prev.find(o => o.cartId === oldCartId)
      if (!line) return prev
      newCartId = `${line.itemId}-${newCustomString}`
      if (newCartId === oldCartId) return prev
      const withoutOld = prev.filter(o => o.cartId !== oldCartId)
      const existing = withoutOld.find(o => o.cartId === newCartId)
      if (existing) {
        return withoutOld.map(o =>
          o.cartId === newCartId ? { ...o, qty: o.qty + line.qty } : o
        )
      }
      return [
        ...withoutOld,
        { ...line, customizations: newCustomString, cartId: newCartId },
      ]
    })
    return newCartId
  }

  function incrementCart(cartId: string) {
    setCart(prev =>
      prev.map(o => (o.cartId === cartId ? { ...o, qty: o.qty + 1 } : o))
    )
  }

  function removeFromCart(cartId: string) {
    setCart(prev =>
      prev
        .map(o => (o.cartId === cartId ? { ...o, qty: o.qty - 1 } : o))
        .filter(o => o.qty > 0)
    )
  }

  async function submitOrder() {
    if (cart.length === 0) return

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          paymentTypeId: 1, // adjust for your payment method mapping
        }),
      })

      if (!response.ok) {
        throw new Error('Order submission failed on server');
      }

      const data = await response.json()
      alert(`Order submitted! Sale ID: ${data.saleId}\nTotal: $${Number(data.total).toFixed(2)}`)
      setCart([])
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      console.error('Order Error:', error)
      alert('Could not submit order. Please check the network connectivity and try again.')
    }
  }

  return (
    <div className="flex h-screen bg-white font-sans">
      <ChatWidget
        menuItems={items}
        cart={cart}
        weather={weather}
        onAddToCart={addToCartFromChat}
        onModifyCartLine={modifyChatCartLine}
        onSelectCategory={setSelectedCategory}
      />
      {/* Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{customizingItem.itemname}</h2>
            <p className="text-gray-500 mb-6">Customize your drink</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Drink Size</label>
                <select 
                  value={drinkSize} 
                  onChange={(e) => setDrinkSize(e.target.value)}
                  className="w-full text-black p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ice Level</label>
                <select 
                  value={iceLevel} 
                  onChange={(e) => setIceLevel(e.target.value)}
                  className="w-full text-black p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option>Normal Ice</option>
                  <option>Less Ice</option>
                  <option>No Ice</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sugar Level</label>
                <select 
                  value={sugarLevel} 
                  onChange={(e) => setSugarLevel(e.target.value)}
                  className="w-full text-black p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option>100% Sugar</option>
                  <option>75% Sugar</option>
                  <option>50% Sugar</option>
                  <option>25% Sugar</option>
                  <option>0% Sugar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Boba</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    aria-pressed={bobaOption === 'Regular Boba'}
                    onClick={() => setBobaOption('Regular Boba')}
                    className={`rounded-lg border p-3 flex flex-col items-center justify-center transition-colors ${
                      bobaOption === 'Regular Boba'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">🧋</span>
                    <span className="text-xs mt-1 font-medium">Regular</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={bobaOption === 'Extra Boba'}
                    onClick={() => setBobaOption('Extra Boba')}
                    className={`rounded-lg border p-3 flex flex-col items-center justify-center transition-colors ${
                      bobaOption === 'Extra Boba'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">🧋+</span>
                    <span className="text-xs mt-1 font-medium">Extra</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={bobaOption === 'No Boba'}
                    onClick={() => setBobaOption('No Boba')}
                    className={`rounded-lg border p-3 flex flex-col items-center justify-center transition-colors ${
                      bobaOption === 'No Boba'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">🚫🧋</span>
                    <span className="text-xs mt-1 font-medium">None</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCustomization}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

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
        <header className="px-6 py-4 border-b border-gray-200 flex items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-2xl font-bold text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
              >
                ←
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {selectedCategory ? selectedCategory : 'Order Kiosk'}
            </h1>
          </div>
          {!weatherLoading && weather && (
            <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 text-sm flex-shrink-0">
              <p className="font-semibold text-blue-900">{weather.current.temperature?.toFixed(1)}°F</p>
              {weather.daily && (
                <p className="text-xs text-blue-800">H: {weather.daily.temperature_2m_max?.[0]?.toFixed(1)}° / L: {weather.daily.temperature_2m_min?.[0]?.toFixed(1)}°</p>
              )}
            </div>
          )}
          <div id="google_translate_element" suppressHydrationWarning className="flex-shrink-0"></div>
        </header>

        {/* Menu grid - Show categories or items */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!selectedCategory ? (
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
                  onClick={() => openCustomization(item)}
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
                key={item.cartId}
                className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{item.itemName}</p>
                  {item.customizations && (
                    <p className="text-xs text-gray-500 mt-1">{item.customizations}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200 font-bold text-sm cursor-pointer transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-800">{item.qty}</span>
                  <button
                    onClick={() => incrementCart(item.cartId)}
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