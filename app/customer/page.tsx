'use client'

import { useState, useEffect, useRef } from 'react'
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

  // Accessibility states
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const [textSize, setTextSize] = useState('normal')
  const [highContrast, setHighContrast] = useState(false)
  const textSizeInputRef = useRef<HTMLInputElement>(null)

  // Apply accessibility settings via CSS variables
  useEffect(() => {
    const root = document.documentElement
    
    // Text size multiplier
    const sizeMultiplier = textSize === 'large' ? 1.2 : textSize === 'xlarge' ? 1.5 : 1
    root.style.setProperty('--text-scale', sizeMultiplier.toString())
    
    if (highContrast) {
      root.style.setProperty('--bg-primary', '#000000')
      root.style.setProperty('--bg-secondary', '#1a1a1a')
      root.style.setProperty('--text-primary', '#ffffff')
      root.style.setProperty('--text-secondary', '#ffffff')
      root.style.setProperty('--text-muted', '#d1d5db')
      root.style.setProperty('--border-color', '#ffffff')
      root.style.setProperty('--accent-color', '#ffff00')
      root.style.setProperty('--button-primary-bg', '#ffffff')
      root.style.setProperty('--button-primary-text', '#000000')
      root.style.setProperty('--button-secondary-bg', '#1a1a1a')
      root.style.setProperty('--button-secondary-text', '#ffffff')
      root.style.setProperty('--button-danger-bg', '#1a1a1a')
      root.style.setProperty('--button-danger-text', '#ffffff')
      root.style.setProperty('--button-success-bg', '#1a1a1a')
      root.style.setProperty('--button-success-text', '#ffffff')
      root.style.setProperty('--card-bg', '#1a1a1a')
      root.style.setProperty('--card-border', '#ffffff')
      root.style.setProperty('--card-text', '#ffffff')
      root.style.setProperty('--input-bg', '#1a1a1a')
      root.style.setProperty('--input-border', '#ffffff')
      root.style.setProperty('--input-text', '#ffffff')
      root.style.setProperty('--header-border', '#ffffff')
    } else {
      root.style.setProperty('--bg-primary', '#ffffff')
      root.style.setProperty('--bg-secondary', '#f3f4f6')
      root.style.setProperty('--text-primary', '#000000')
      root.style.setProperty('--text-secondary', '#666666')
      root.style.setProperty('--text-muted', '#9ca3af')
      root.style.setProperty('--border-color', '#d1d5db')
      root.style.setProperty('--accent-color', '#2563eb')
      root.style.setProperty('--button-primary-bg', '#2563eb')
      root.style.setProperty('--button-primary-text', '#ffffff')
      root.style.setProperty('--button-secondary-bg', '#f3f4f6')
      root.style.setProperty('--button-secondary-text', '#374151')
      root.style.setProperty('--button-danger-bg', '#fee2e2')
      root.style.setProperty('--button-danger-text', '#dc2626')
      root.style.setProperty('--button-success-bg', '#dcfce7')
      root.style.setProperty('--button-success-text', '#16a34a')
      root.style.setProperty('--card-bg', '#f9fafb')
      root.style.setProperty('--card-border', '#e5e7eb')
      root.style.setProperty('--card-text', '#111827')
      root.style.setProperty('--input-bg', '#f9fafb')
      root.style.setProperty('--input-border', '#d1d5db')
      root.style.setProperty('--input-text', '#000000')
      root.style.setProperty('--header-border', '#e5e7eb')
    }
  }, [textSize, highContrast])

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
    <div 
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: `calc(16px * var(--text-scale))`,
      }}
      className="flex h-screen font-sans"
    >
      <ChatWidget
        menuItems={items}
        cart={cart}
        weather={weather}
        onAddToCart={addToCartFromChat}
        onModifyCartLine={modifyChatCartLine}
        onSelectCategory={setSelectedCategory}
        textSize={textSize}
        highContrast={highContrast}
      />
      {/* Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="rounded-2xl p-6 w-96 shadow-xl border-2" style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--card-border)',
            color: 'var(--card-text)'
          }}>
            <h2 className="text-2xl font-bold mb-2">{customizingItem.itemname}</h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Customize your drink</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Drink Size</label>
                <select 
                  value={drinkSize} 
                  onChange={(e) => setDrinkSize(e.target.value)}
                  className="w-full p-3 rounded-lg border" 
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--input-text)'
                  }}
                >
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Ice Level</label>
                <select 
                  value={iceLevel} 
                  onChange={(e) => setIceLevel(e.target.value)}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--input-text)'
                  }}
                >
                  <option>Normal Ice</option>
                  <option>Less Ice</option>
                  <option>No Ice</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Sugar Level</label>
                <select 
                  value={sugarLevel} 
                  onChange={(e) => setSugarLevel(e.target.value)}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--input-text)'
                  }}
                >
                  <option>100% Sugar</option>
                  <option>75% Sugar</option>
                  <option>50% Sugar</option>
                  <option>25% Sugar</option>
                  <option>0% Sugar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Boba</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Regular Boba' as const, emoji: '🧋', label: 'Regular' },
                    { value: 'Extra Boba' as const, emoji: '🧋+', label: 'Extra' },
                    { value: 'No Boba' as const, emoji: '🚫🧋', label: 'None' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={bobaOption === option.value}
                      onClick={() => setBobaOption(option.value)}
                      className="rounded-lg border p-3 flex flex-col items-center justify-center transition-colors"
                      style={{
                        borderColor: bobaOption === option.value ? 'var(--accent-color)' : 'var(--card-border)',
                        backgroundColor: bobaOption === option.value ? 'var(--accent-color)' : 'var(--card-bg)',
                        color: bobaOption === option.value ? '#ffffff' : 'var(--card-text)'
                      }}
                    >
                      <span className="text-xl">{option.emoji}</span>
                      <span className="text-xs mt-1 font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-3 rounded-xl font-semibold hover:opacity-80 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  color: 'var(--button-secondary-text)'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmCustomization}
                className="flex-1 py-3 rounded-xl font-semibold hover:opacity-80 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)'
                }}
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
          <div className="px-6 py-3 rounded-lg shadow-lg font-semibold text-center" style={{
            backgroundColor: 'var(--button-success-bg)',
            color: 'var(--button-success-text)'
          }}>
            ✓ {addedNotification} added to cart!
          </div>
        </div>
      )}
      {/* Left panel - Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b flex items-center gap-4" style={{ borderColor: 'var(--header-border)' }}>
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-2xl font-bold transition-colors flex-shrink-0"
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                ←
              </button>
            )}
            <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {selectedCategory ? selectedCategory : 'Order Kiosk'}
            </h1>
          </div>
          {!weatherLoading && weather && (
            <div className="px-3 py-2 rounded-lg border text-sm flex-shrink-0" style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--accent-color)',
              color: 'var(--accent-color)'
            }}>
              <p className="font-semibold">{weather.current.temperature?.toFixed(1)}°F</p>
              {weather.daily && (
                <p className="text-xs">H: {weather.daily.temperature_2m_max?.[0]?.toFixed(1)}° / L: {weather.daily.temperature_2m_min?.[0]?.toFixed(1)}°</p>
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
                  className="rounded-2xl border-2 p-6 text-left transition-all cursor-pointer shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--card-text)'
                  }}
                >
                  <p className="font-bold text-2xl leading-snug">{cat}</p>
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>{items.filter(i => i.category === cat).length} items</p>
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
                  className="rounded-2xl border-2 p-6 text-left transition-all cursor-pointer shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--card-text)'
                  }}
                >
                  <p className="font-bold text-lg leading-snug">{item.itemname}</p>
                  {item.description && (
                    <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                  )}
                  <p className="mt-3 font-bold text-xl" style={{ color: 'var(--accent-color)' }}>${item.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Cart */}
      <div className="w-96 border-l flex flex-col" style={{
        borderColor: 'var(--header-border)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header */}
        <header className="px-6 py-4 border-b" style={{
          borderColor: 'var(--header-border)'
        }}>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Your Order</h2>
        </header>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-center mt-12 font-medium" style={{ color: 'var(--text-muted)' }}>No items selected</p>
          ) : (
            cart.map(item => (
              <div
                key={item.cartId}
                className="flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{item.itemName}</p>
                  {item.customizations && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.customizations}</p>
                  )}
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="w-6 h-6 flex items-center justify-center rounded font-bold text-sm cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'var(--button-danger-bg)',
                      color: 'var(--button-danger-text)'
                    }}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-800">{item.qty}</span>
                  <button
                    onClick={() => incrementCart(item.cartId)}
                    className="w-6 h-6 flex items-center justify-center rounded font-bold text-sm cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'var(--button-success-bg)',
                      color: 'var(--button-success-text)'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Total and buttons */}
        <div className="px-6 py-5 border-t space-y-4" style={{
          borderColor: 'var(--header-border)'
        }}>
          {submitted && (
            <div className="rounded-lg border text-sm px-4 py-3 text-center font-semibold" style={{
              backgroundColor: 'var(--button-success-bg)',
              borderColor: 'var(--button-success-text)',
              color: 'var(--button-success-text)'
            }}>
              Order placed successfully!
            </div>
          )}

          <div className="rounded-lg p-4 border" style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)'
          }}>
            <div className="flex justify-between items-center">
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between items-center" style={{
              borderColor: 'var(--bg-secondary)'
            }}>
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--accent-color)' }}>${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={submitOrder}
            disabled={cart.length === 0}
            className="w-full py-4 rounded-xl font-bold text-lg
                       hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md"
            style={{
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-primary-text)'
            }}
          >
            Complete Order
          </button>

          <button
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="w-full py-2 rounded-lg font-medium text-sm
                       hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              color: 'var(--button-secondary-text)'
            }}
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Accessibility Modal */}
      {accessibilityOpen && (
        <div className="fixed inset-10 z-50 flex items-end justify-start">
          <div className="rounded-2xl p-6 w-80 shadow-xl border-2" style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)'
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Accessibility</h3>
              <button
                onClick={() => setAccessibilityOpen(false)}
                className="text-2xl font-bold hover:opacity-70 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Text Size */}
              <div>
                <label className="block text-sm font-semibold mb-2">Text Size</label>
                <div className="flex items-center gap-3">
                  <span style={{ color: 'var(--text-muted)' }}>A</span>
                  <input
                    ref={textSizeInputRef}
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    defaultValue={textSize === 'large' ? 2 : textSize === 'xlarge' ? 3 : 1}
                    onMouseUp={() => {
                      if (textSizeInputRef.current) {
                        const val = parseInt(textSizeInputRef.current.value)
                        setTextSize(val === 2 ? 'large' : val === 3 ? 'xlarge' : 'normal')
                      }
                    }}
                    onTouchEnd={() => {
                      if (textSizeInputRef.current) {
                        const val = parseInt(textSizeInputRef.current.value)
                        setTextSize(val === 2 ? 'large' : val === 3 ? 'xlarge' : 'normal')
                      }
                    }}
                    className="flex-1"
                  />
                  <span className="text-xl" style={{ color: 'var(--text-muted)' }}>A</span>
                </div>
              </div>

              {/* High Contrast Toggle */}
              <div>
                <label className="block text-sm font-semibold mb-2">High Contrast</label>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`w-full py-3 rounded-lg font-medium transition-colors cursor-pointer border-2`}
                  style={{
                    backgroundColor: highContrast ? 'var(--button-primary-bg)' : 'var(--button-secondary-bg)',
                    color: highContrast ? 'var(--button-primary-text)' : 'var(--button-secondary-text)',
                    borderColor: highContrast ? 'var(--button-primary-bg)' : 'var(--card-border)'
                  }}
                >
                  {highContrast ? '✓ On' : 'Off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Button */}
      <button
        onClick={() => setAccessibilityOpen(!accessibilityOpen)}
        className={`fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full shadow-lg font-bold text-lg flex items-center justify-center transition-all hover:scale-110 cursor-pointer border-2`}
        style={{
          backgroundColor: 'var(--button-primary-bg)',
          color: 'var(--button-primary-text)',
          borderColor: 'var(--button-primary-bg)'
        }}
        title="Accessibility Options"
        aria-label="Accessibility Options"
      >
        ♿
      </button>
    </div>
  );
}