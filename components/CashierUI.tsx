'use client'

import { useState, useEffect } from 'react'

interface MenuItem {
  id: number
  name: string
  price: number
  category: string
}

interface OrderItem {
  itemId: number
  itemName: string
  price: number
  qty: number
  customizations?: string
  cartId: string
}

const SIZES = [
  { name: 'Medium', price: 0.00 },
  { name: 'Large', price: 0.75 }
]
const TEMPERATURES = [
  { name: 'Hot', price: 0.00 },
  { name: 'Cold', price: 0.00 }
]
const ICE_LEVELS = [
  { name: 'Normal Ice', price: 0.00 },
  { name: 'Extra Ice', price: 0.00 },
  { name: 'Less Ice', price: 0.00 },
  { name: 'No Ice', price: 0.00 }
]
const SUGAR_LEVELS = [
  { name: '120% Sugar', price: 0.00 },
  { name: '100% Sugar', price: 0.00 },
  { name: '75% Sugar', price: 0.00 },
  { name: '50% Sugar', price: 0.00 },
  { name: '25% Sugar', price: 0.00 },
  { name: '0% Sugar', price: 0.00 }
]
const MILK_ALTS = [
  { name: 'Whole Milk', price: 0.00 },
  { name: 'Oat Milk', price: 0.50 },
  { name: 'Almond Milk', price: 0.50 },
  { name: 'Soy Milk', price: 0.50 },
  { name: 'Lactose-Free', price: 0.50 }
]
const TOPPINGS = [
  { name: 'Boba', price: 0.50 },
  { name: 'Grass Jelly', price: 0.50 },
  { name: 'Lychee Jelly', price: 0.50 },
  { name: 'Pudding', price: 0.50 },
  { name: 'Aloe Vera', price: 0.50 },
  { name: 'Cheese Foam', price: 0.75 },
  { name: 'Pop Boba', price: 0.60 }
]

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return <>{children}</>
}

export default function CashierUI() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [paymentType, setPaymentType] = useState<'Card' | 'Cash'>('Card')
  const [submitted, setSubmitted] = useState(false)
  const [queueMinutes, setQueueMinutes] = useState<number | null>(null)

  // Customization states
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const [drinkSize, setDrinkSize] = useState(SIZES[0])
  const [temperature, setTemperature] = useState(TEMPERATURES[0])
  const [iceLevel, setIceLevel] = useState(ICE_LEVELS[0])
  const [sugarLevel, setSugarLevel] = useState(SUGAR_LEVELS[1])
  const [milkAlt, setMilkAlt] = useState(MILK_ALTS[0])
  const [selectedToppings, setSelectedToppings] = useState<{name: string, price: number}[]>([])

  useEffect(() => {
    async function fetchMenuItems() {
      try {
        const res = await fetch('/api/items')
        if (!res.ok) throw new Error('Failed to fetch menu items')

        const raw: unknown = await res.json()
        if (!Array.isArray(raw)) throw new Error('Invalid items payload')

        const formattedData: MenuItem[] = raw
          .map((item: any) => ({
            id: Number(item?.itemid),
            name: String(item?.itemname ?? ''),
            price: Number(item?.price),
            category: String(item?.category ?? 'Uncategorized'),
          }))
          .filter(
            item =>
              Number.isFinite(item.id) &&
              item.name.length > 0 &&
              Number.isFinite(item.price) &&
              item.category.length > 0
          )

        setMenuItems(formattedData)

        const uniqueCategories = Array.from(new Set(formattedData.map(item => item.category)))
        setCategories(['All', ...uniqueCategories])
      } catch (error) {
        console.error('Cashier fetch error:', error)
        setMenuItems([])
        setCategories(['All'])
      }
    }

    fetchMenuItems()
  }, [])

  const visibleItems =
    activeCategory === 'All'
      ? menuItems
      : menuItems.filter(item => item.category === activeCategory)

  const orderTotal = cart.reduce((sum, o) => sum + o.price * o.qty, 0)

  function openCustomization(item: MenuItem) {
    if (item.category.toLowerCase().includes('snack')) {
      const cartId = `${item.id}-no-customization`
      
      setCart(prev => {
        const existing = prev.find(o => o.cartId === cartId)
        if (existing) {
          return prev.map(o =>
            o.cartId === cartId ? { ...o, qty: o.qty + 1 } : o
          )
        }
        return [...prev, { 
          itemId: item.id, 
          itemName: item.name, 
          price: item.price, 
          qty: 1,
          cartId
        }]
      })
      return
    }

    setCustomizingItem(item)
    setDrinkSize(SIZES[0])
    setTemperature(TEMPERATURES[0])
    setIceLevel(ICE_LEVELS[0])
    setSugarLevel(SUGAR_LEVELS[1])
    setMilkAlt(MILK_ALTS[0])
    setSelectedToppings([])
  }

  function toggleTopping(topping: {name: string, price: number}) {
    setSelectedToppings(prev => 
      prev.find(t => t.name === topping.name)
        ? prev.filter(t => t.name !== topping.name)
        : [...prev, topping]
    )
  }

  function confirmCustomization() {
    if (!customizingItem) return
    
    const toppingsStr = selectedToppings.length > 0 ? selectedToppings.map(t => t.name).join(', ') : 'No Toppings'
    const customString = `${temperature.name}, ${drinkSize.name}, ${iceLevel.name}, ${sugarLevel.name}, ${milkAlt.name}, ${toppingsStr}`
    const cartId = `${customizingItem.id}-${customString}`
    
    const customizationsCost = drinkSize.price + milkAlt.price + selectedToppings.reduce((sum, t) => sum + t.price, 0)
    const finalPrice = customizingItem.price + customizationsCost

    setCart(prev => {
      const existing = prev.find(o => o.cartId === cartId)
      if (existing) {
        return prev.map(o =>
          o.cartId === cartId ? { ...o, qty: o.qty + 1 } : o
        )
      }
      return [...prev, { 
        itemId: customizingItem.id, 
        itemName: customizingItem.name, 
        price: finalPrice, 
        qty: 1,
        customizations: customString,
        cartId
      }]
    })

    setCustomizingItem(null)
  }

  function removeFromCart(cartId: string) {
    setCart(prev =>
      prev
        .map(o => (o.cartId === cartId ? { ...o, qty: o.qty - 1 } : o))
        .filter(o => o.qty > 0)
    )
  }

  function increaseQuantity(cartId: string) {
    setCart(prev => prev.map(o => (o.cartId === cartId ? { ...o, qty: o.qty + 1 } : o)))
  }

  function setCustomQuantity(cartId: string) {
    const input = window.prompt('Enter new quantity:')
    if (input === null || input.trim() === '') return
    
    const newQty = parseInt(input, 10)
    if (isNaN(newQty) || newQty < 0) {
      alert('Please enter a valid positive number.')
      return
    }

    setCart(prev =>
      newQty === 0
        ? prev.filter(o => o.cartId !== cartId)
        : prev.map(o => (o.cartId === cartId ? { ...o, qty: newQty } : o))
    )
  }

  async function submitOrder() {
    if (cart.length === 0) return
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          paymentTypeId: paymentType === 'Card' ? 1 : 0
        })
      })

      if (!res.ok) {
        throw new Error('Failed to complete order.')
      }

      const data = await res.json()
      setCart([])
      setPaymentType('Card')
      setQueueMinutes(data.queueMinutes ?? null)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      console.error(error)
      alert('There was an error submitting the order. Please try again.')
    }
  }

  return (
    <div className="flex h-full w-full bg-white font-sans relative">
      {/* Cashier Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-md p-7 w-[860px] max-w-[95vw] shadow-xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-900 border-b border-gray-100 pb-3">{customizingItem.name}</h2>
            
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-gray-500 text-sm uppercase tracking-wider">Size</span>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(opt => {
                      const isSelected = drinkSize.name === opt.name;
                      return (
                        <button 
                          key={opt.name} 
                          onClick={() => setDrinkSize(opt)} 
                          className={`py-2 px-3 border rounded font-medium text-sm transition-colors ${
                            isSelected 
                              ? 'bg-gray-900 border-gray-900 text-white' 
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {opt.name}
                          {opt.price > 0 && (
                            <span 
                              className="ml-1 text-[11px]" 
                              style={{ color: isSelected ? 'rgba(255, 255, 255, 0.7)' : '#6b7280' }}
                            >
                              (+${opt.price.toFixed(2)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!['refresher', 'slush'].includes((customizingItem?.category || '').toLowerCase()) && (
                  <div className="flex flex-col gap-2">
                    <span className="font-medium text-gray-500 text-sm uppercase tracking-wider">Temperature</span>
                    <div className="flex flex-wrap gap-2">
                      {TEMPERATURES.map(opt => (
                        <button 
                          key={opt.name} 
                          onClick={() => setTemperature(opt)} 
                          className={`py-2 px-3 border rounded font-medium text-sm transition-colors ${
                            temperature.name === opt.name 
                              ? 'bg-gray-900 border-gray-900 text-white' 
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="font-medium text-gray-500 text-sm uppercase tracking-wider">Ice</span>
                <div className="flex flex-wrap gap-2">
                  {ICE_LEVELS.map(opt => (
                    <button key={opt.name} onClick={() => setIceLevel(opt)} className={`py-2 px-3 border rounded font-medium text-sm transition-colors ${iceLevel.name === opt.name ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-gray-500 text-sm uppercase tracking-wider">Sugar</span>
                <div className="flex flex-wrap gap-2">
                  {SUGAR_LEVELS.map(opt => (
                    <button key={opt.name} onClick={() => setSugarLevel(opt)} className={`py-2 px-3 border rounded font-medium text-sm transition-colors ${sugarLevel.name === opt.name ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      {opt.name.replace(' Sugar', '')}
                    </button>
                  ))}
                </div>
              </div>

              {['milk tea', 'fruit tea', 'specialty'].includes((customizingItem?.category || '').toLowerCase()) && (
                <>
                  <div className="flex flex-col gap-2">
                    <span className="font-medium text-gray-500 text-sm uppercase tracking-wider">Milk</span>
                    <div className="flex flex-wrap gap-2">
                      {MILK_ALTS.map(opt => {
                        const isSelected = milkAlt.name === opt.name;
                        return (
                          <button 
                            key={opt.name} 
                            onClick={() => setMilkAlt(opt)} 
                            className={`py-2 px-3 border rounded font-medium text-sm transition-colors ${
                              isSelected 
                                ? 'bg-gray-900 border-gray-900 text-white' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {opt.name}
                            {opt.price > 0 && (
                              <span 
                                className="ml-1 text-[11px]" 
                                style={{ color: isSelected ? 'rgba(255, 255, 255, 0.7)' : '#6b7280' }}
                              >
                                (+${opt.price.toFixed(2)})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-medium text-gray-500 text-sm uppercase tracking-wider">Toppings</span>
                    <div className="flex flex-wrap gap-2">
                      {TOPPINGS.map(opt => {
                        const isSelected = selectedToppings.some(t => t.name === opt.name);
                        return (
                          <button 
                            key={opt.name} 
                            onClick={() => toggleTopping(opt)} 
                            className={`py-2 px-3 border rounded font-medium text-sm transition-colors ${
                              isSelected 
                                ? 'bg-gray-900 border-gray-900 text-white' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {opt.name}
                            {opt.price > 0 && (
                              <span 
                                className="ml-1 text-[11px]" 
                                style={{ color: isSelected ? 'rgba(255, 255, 255, 0.7)' : '#6b7280' }}
                              >
                                (+${opt.price.toFixed(2)})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-4 border-t border-gray-100 pt-5">
              <button onClick={() => setCustomizingItem(null)} className="flex-1 py-3 bg-white text-gray-600 border border-gray-200 font-medium text-base rounded hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmCustomization} className="flex-[2] py-3 bg-gray-900 text-white font-medium text-base rounded hover:bg-gray-800 transition-colors">
                Add to Order (+${((drinkSize.price + milkAlt.price + selectedToppings.reduce((sum, t) => sum + t.price, 0)) + customizingItem.price).toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Category filter bar */}
        <div className="px-6 py-3 flex gap-2 border-b border-gray-100 overflow-x-auto">
          {categories.map(cat => (
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
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {visibleItems.map(item => (
              <button
                key={item.id}
                onClick={() => openCustomization(item)}
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

      {/* Right sidebar */}
      <aside className="w-80 border-l border-gray-200 flex flex-col bg-gray-50">
        <div className="px-4 py-4 border-b border-gray-200 bg-white">
          <h2 className="font-semibold text-gray-800">Current Order</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-8">No items added</p>
          ) : (
            cart.map(item => (
              <div
                key={item.cartId}
                className="flex flex-col rounded-xl bg-white border border-gray-200 px-3 py-2 text-sm shadow-sm"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-gray-800 pr-2">{item.itemName}</p>
                  <p className="font-semibold text-gray-800">${(item.price * item.qty).toFixed(2)}</p>
                </div>
                {item.customizations && (
                  <p className="text-[11px] text-gray-500 mb-2 leading-tight pr-4">{item.customizations}</p>
                )}
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">${item.price.toFixed(2)} / ea</p>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-red-500 font-bold cursor-pointer transition-colors"
                    >
                      &minus;
                    </button>
                    <button
                      onClick={() => setCustomQuantity(item.cartId)}
                      className="min-w-[2rem] text-center font-semibold text-gray-800 hover:underline cursor-pointer"
                      title="Click to enter custom quantity"
                    >
                      {item.qty}
                    </button>
                    <button
                      onClick={() => increaseQuantity(item.cartId)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600 font-bold cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-white space-y-3">
          {submitted && (
            <div className="rounded-lg bg-green-100 border border-green-300 text-green-800 text-sm px-3 py-2 text-center font-medium">
              Order placed!{queueMinutes != null ? ` Ready in ~${queueMinutes} min` : ''}
            </div>
          )}

          <ClientOnly>
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
          </ClientOnly>

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