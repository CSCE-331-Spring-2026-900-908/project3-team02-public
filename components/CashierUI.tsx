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
  const [drinkSize, setDrinkSize] = useState('Medium')
  const [drinkTemp, setDrinkTemp] = useState('Cold')
  const [iceLevel, setIceLevel] = useState('Normal Ice')
  const [sugarLevel, setSugarLevel] = useState('100% Sugar')
  const [bobaOption, setBobaOption] = useState('Regular Boba')

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

  const cartSubtotal = cart.reduce((sum, o) => sum + o.price * o.qty, 0)
  const cartTax = cartSubtotal * 0.0825
  const orderTotal = cartSubtotal + cartTax

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
    setDrinkSize('Medium')
    setDrinkTemp('Cold')
    setIceLevel('Normal Ice')
    setSugarLevel('100% Sugar')
    setBobaOption('Regular Boba')
  }

  function confirmCustomization() {
    if (!customizingItem) return
    
    const customString = `${drinkTemp}, ${drinkSize}, ${iceLevel}, ${sugarLevel}, ${bobaOption}`
    const cartId = `${customizingItem.id}-${customString}`

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
        price: customizingItem.price, 
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
          <div className="bg-white rounded-md p-7 w-[760px] max-w-[95vw] shadow-xl flex flex-col gap-7">
            <h2 className="text-2xl font-semibold text-gray-900 border-b border-gray-100 pb-3">{customizingItem.name}</h2>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-500 text-base w-14 uppercase tracking-wider">Size</span>
                <div className="flex gap-2 flex-1">
                  {['Medium', 'Large'].map(opt => (
                    <button key={opt} onClick={() => setDrinkSize(opt)} className={`flex-1 py-2.5 px-2 border rounded font-medium text-base transition-colors ${drinkSize === opt ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-500 text-base w-14 uppercase tracking-wider">Temp</span>
                <div className="flex gap-2 flex-1">
                  {['Hot', 'Cold'].map(opt => (
                    <button key={opt} onClick={() => setDrinkTemp(opt)} className={`flex-1 py-2.5 px-2 border rounded font-medium text-base transition-colors ${drinkTemp === opt ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-500 text-base w-14 uppercase tracking-wider">Ice</span>
                <div className="flex gap-2 flex-1">
                  {['Normal Ice', 'Less Ice', 'No Ice'].map(opt => (
                    <button key={opt} onClick={() => setIceLevel(opt)} className={`flex-1 py-2.5 px-2 border rounded font-medium text-base transition-colors ${iceLevel === opt ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-500 text-base w-14 uppercase tracking-wider">Sugar</span>
                <div className="flex gap-2 flex-1">
                  {['120% Sugar', '100% Sugar', '75% Sugar', '50% Sugar', '25% Sugar', '0% Sugar'].map(opt => (
                    <button 
                      key={opt} 
                      onClick={() => setSugarLevel(opt)} 
                      className={`flex-1 py-2.5 px-1 border rounded font-medium text-sm transition-colors ${sugarLevel === opt ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {opt.replace(' Sugar', '')}
                    </button>
                  ))}
                </div>
              </div>

              {['milk tea', 'fruit tea', 'specialty'].includes((customizingItem?.category || '').toLowerCase()) && (
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-500 text-base w-14 uppercase tracking-wider">Boba</span>
                  <div className="flex gap-2 flex-1">
                    {['Regular Boba', 'Extra Boba', 'No Boba'].map(opt => (
                      <button key={opt} onClick={() => setBobaOption(opt)} className={`flex-1 py-2.5 px-2 border rounded font-medium text-base transition-colors ${bobaOption === opt ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setCustomizingItem(null)} className="flex-1 py-3 bg-white text-gray-600 border border-gray-200 font-medium text-base rounded hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmCustomization} className="flex-[2] py-3 bg-gray-900 text-white font-medium text-base rounded hover:bg-gray-800 transition-colors">Add to Order</button>
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

          <div className="flex justify-between text-sm font-normal text-gray-800">
            <span>Subtotal</span>
            <span>${cartSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-light text-gray-800">
            <span>Tax</span>
            <span>${cartTax.toFixed(2)}</span>
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