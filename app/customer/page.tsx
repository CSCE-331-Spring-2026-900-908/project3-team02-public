'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { MenuItem, OrderItem, ChatSelections } from './types'
import { MENU_ITEMS } from '../data/menu'
import ChatWidget from './ChatWidget'
import QRLoginSection from '@/components/QRLoginSection'

export default function KioskPage() {
  
  const { data: session } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Inject range slider styles + Google Translate style
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--bg-secondary);
        outline: none;
        accent-color: var(--accent-color);
      }
      
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--accent-color);
        cursor: pointer;
        margin-top: -6px;
      }
      
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--accent-color);
        cursor: pointer;
        border: none;
      }
      
      /* Google Translate widget styling*/
      body {
        top: 0 !important;
      }

      .skiptranslate > iframe {
        display: none !important;
      }

      #goog-gt-tt, .goog-te-balloon-frame {
        display: none !important;
      }

      .goog-te-gadget {
        color: transparent !important;
        font-size: 0px !important;
      }

      .goog-logo-link, 
      .goog-logo-link img, 
      .goog-te-gadget span {
        display: none !important;
      }

      .goog-te-gadget .goog-te-combo {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
        border: 1px solid var(--accent-color) !important;
        border-radius: 0.5rem !important;
        padding: 0.375rem 0.5rem !important;
        font-family: inherit !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        outline: none !important;
        cursor: pointer !important;
        margin: 0 !important;
        transition: border-color 0.2s ease;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<OrderItem[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [orderResult, setOrderResult] = useState<{ saleId: number; total: number; queueMinutes: number } | null>(null)
  const [addedNotification, setAddedNotification] = useState<string | null>(null)

  // Customization states
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const [drinkSize, setDrinkSize] = useState('Medium')
  const [drinkTemp, setDrinkTemp] = useState('Cold')
  const [iceLevel, setIceLevel] = useState('Normal Ice')
  const [sugarLevel, setSugarLevel] = useState('100% (Regular) Sweetness')
  const [bobaOption, setBobaOption] = useState('')
  const [milkAlt, setMilkAlt] = useState('Whole Milk')
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])

  const [customizationsByCategory, setCustomizationsByCategory] = useState<{
    [key: string]: Customization[]
  }>({})

  // Add these with your other state declarations
  const [weather, setWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  // Accessibility states
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const [textSize, setTextSize] = useState('normal')
  const [highContrast, setHighContrast] = useState(false)
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)
  const textSizeInputRef = useRef<HTMLInputElement>(null)
  const kioskRef = useRef<HTMLDivElement>(null)

  // Screen Reader Logic (Tap to Read, Double-Tap to Activate)
  useEffect(() => {
    if (!screenReaderEnabled) {
      window.speechSynthesis?.cancel()
      return
    }

    let lastClickTarget: EventTarget | null = null
    let lastClickTime = 0

    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      const now = Date.now()
      const isDoubleTap = e.target === lastClickTarget && (now - lastClickTime) < 400

      if (!isDoubleTap) {
        // Single tap: Read it, block the actual click action
        e.preventDefault()
        e.stopPropagation()
        
        const target = e.target as HTMLElement
        // Try to find the closest interactive element to read its full context
        const interactiveEl = target.closest('button, a, select, input, [role="button"]')
        const elementToRead = interactiveEl || target
        
        const textToRead = 
          elementToRead.getAttribute('aria-label') || 
          elementToRead.getAttribute('title') || 
          (elementToRead as HTMLElement).innerText || 
          elementToRead.textContent

        if (textToRead && textToRead.trim()) {
          window.speechSynthesis?.cancel()
          const utterance = new SpeechSynthesisUtterance(textToRead.trim())
          // Optional: Adjust speech rate or voice here
          utterance.rate = 1.0 
          window.speechSynthesis?.speak(utterance)
        }

        lastClickTarget = e.target
        lastClickTime = now
      } else {
        // Double tap: let the click through, reset state
        lastClickTarget = null
      }
    }

    // Use capture phase to intercept the click before React processes it
    document.addEventListener('click', handleInteraction, true)

    return () => {
      document.removeEventListener('click', handleInteraction, true)
      window.speechSynthesis?.cancel()
    }
  }, [screenReaderEnabled])

  // Apply accessibility settings via CSS variables
  useEffect(() => {
    const root = kioskRef.current ?? document.documentElement

    // --text-scale must live on <html> so `html { font-size: calc(16px * var(--text-scale)) }` picks it up
    const sizeMultiplier = textSize === 'large' ? 1.2 : textSize === 'xlarge' ? 1.5 : 1
    document.documentElement.style.setProperty('--text-scale', sizeMultiplier.toString())
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
      root.style.setProperty('--bg-primary', '#F8F4EF')
      root.style.setProperty('--bg-secondary', '#F3EEE8')
      root.style.setProperty('--text-primary', '#2E2A28')
      root.style.setProperty('--text-secondary', '#7A6F6B')
      root.style.setProperty('--text-muted', '#9C8E85')
      root.style.setProperty('--border-color', '#D9D0C8')
      root.style.setProperty('--accent-color', '#500000')
      root.style.setProperty('--button-primary-bg', '#500000')
      root.style.setProperty('--button-primary-text', '#ffffff')
      root.style.setProperty('--button-secondary-bg', '#F3EEE8')
      root.style.setProperty('--button-secondary-text', '#2E2A28')
      root.style.setProperty('--button-danger-bg', '#fee2e2')
      root.style.setProperty('--button-danger-text', '#dc2626')
      root.style.setProperty('--button-success-bg', '#E8F3EC')
      root.style.setProperty('--button-success-text', '#16a34a')
      root.style.setProperty('--card-bg', '#FFFDFC')
      root.style.setProperty('--card-border', '#D9D0C8')
      root.style.setProperty('--card-text', '#2E2A28')
      root.style.setProperty('--input-bg', '#FFFDFC')
      root.style.setProperty('--input-border', '#D9D0C8')
      root.style.setProperty('--input-text', '#2E2A28')
      root.style.setProperty('--header-border', '#D9D0C8')
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
            image: r.image ?? null,
          }))
        setItems(normalized)
      } catch (error) {
        console.error('Error fetching items, using hardcoded fallback:', error)
      }
    }

    async function fetchCustomizations() {
      try {
        const response = await fetch('/api/customizations')
        if (!response.ok) return
        const rows = await response.json()
        if (!Array.isArray(rows) || rows.length === 0) return

        const normalized: Customization[] = rows
          .filter((r: any) => r.isactive !== false)
          .map((r: any) => ({
            customizationid: Number(r.customizationid),
            name: String(r.name),
            category: String(r.category),
            price: Number(r.price),
            ingredients: r.ingredients ?? undefined,
            isactive: Boolean(r.isactive),
          }))

        const grouped: Record<string, Customization[]> = {}
        for (const custom of normalized) {
          if (!grouped[custom.category]) grouped[custom.category] = []
          grouped[custom.category].push(custom)
        }

        setCustomizationsByCategory(grouped)
      } catch (error) {
        console.error('Error fetching customizations:', error)
      }
    }

    fetchItems()
    fetchCustomizations()
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
          { pageLanguage: 'en'}, 
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

  const categoryDescriptions: Record<string, string> = {
    'milk tea': 'Creamy classics and house favorites',
    'fruit tea': 'Fresh and fruity favorites',
    'refresher': 'Light, crisp, and easy to sip',
    'slush': 'Frozen and sweet',
    'specialty': 'Signature AggTea picks',
    'snack': 'Something to pair with your drink',
  }

  const categories = Array.from(new Set(items.map(i => i.category))).filter(c => c && c.trim())
  const visibleItems = selectedCategory ? items.filter(i => i.category === selectedCategory) : []
  const cartSubtotal = cart.reduce((sum, o) => sum + o.price * o.qty, 0)
  const cartTax = cartSubtotal * 0.0825
  const orderTotal = cartSubtotal + cartTax

  function openCustomization(item: MenuItem) {
    if (item.category.toLowerCase().includes('snack')) {
      const cartId = `${item.itemid}-no-customization`
      
      setCart(prev => {
        const existing = prev.find(o => o.cartId === cartId)
        if (existing) {
          return prev.map(o =>
            o.cartId === cartId ? { ...o, qty: o.qty + 1 } : o
          )
        }
        return [...prev, { 
          itemId: item.itemid, 
          itemName: item.itemname, 
          price: item.price, 
          qty: 1,
          cartId
        }]
      })

      setAddedNotification(item.itemname)
      setTimeout(() => setAddedNotification(null), 2000)
      return
    }

    setCustomizingItem(item)
    setDrinkSize('Medium')
    setDrinkTemp('Cold')
    setIceLevel('Normal Ice')
    setSugarLevel('100% (Regular) Sweetness')
    setMilkAlt('Whole Milk')
    setSelectedToppings([])
    setBobaOption('')
  }

  function confirmCustomization() {
    if (!customizingItem) return
    
    // Calculate the total customized price
    const baseCost = customizingItem.price
    const sizeUpcharge = customizationsByCategory['Size']?.find(s => s.name === drinkSize)?.price ?? 0
    const milkUpcharge = ['milk tea', 'fruit tea', 'specialty'].includes((customizingItem?.category || '').toLowerCase()) 
      ? (customizationsByCategory['Milk']?.find(m => m.name === milkAlt)?.price ?? 0)
      : 0
    const toppingsCost = selectedToppings.reduce((sum, toppingName) => {
      const topping = customizationsByCategory['Topping']?.find(t => t.name === toppingName)
      return sum + (topping?.price ?? 0)
    }, 0)
    const bobaCost = bobaOption === 'Extra Boba' ? 1.00 : bobaOption === 'Regular Boba' ? 0.50 : 0
    const totalPrice = baseCost + sizeUpcharge + milkUpcharge + toppingsCost + bobaCost
    
    const toppingStr = selectedToppings.length > 0 ? selectedToppings.join(', ') : ''
    const customParts = [drinkTemp, drinkSize, iceLevel, sugarLevel]
    if (milkAlt && ['milk tea', 'fruit tea', 'specialty'].includes((customizingItem?.category || '').toLowerCase())) {
      customParts.push(milkAlt)
    }
    if (toppingStr) customParts.push(toppingStr)
    
    if (bobaOption === 'Extra Boba') {
      customParts.push('Regular Boba')
      customParts.push('Extra Boba')
    } else if (bobaOption) {
      customParts.push(bobaOption)
    }
    
    const customString = customParts.join(', ')
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
        price: totalPrice,
        qty: 1,
        customizations: customString,
        cartId
      }]
    })

    setAddedNotification(customizingItem.itemname)
    setTimeout(() => setAddedNotification(null), 2000)
    setCustomizingItem(null)
  }

  function getDefaultChatSelections(item: MenuItem): ChatSelections {
    const cat = (item.category || '').toLowerCase()
    const isMilkEligible = ['milk tea', 'fruit tea', 'specialty'].includes(cat)
    const c = customizationsByCategory
    const pickName = (catKey: string, preferred?: string) => {
      const opts = c[catKey] ?? []
      if (preferred) {
        const hit = opts.find(o => o.name === preferred)
        if (hit) return hit.name
      }
      return opts[0]?.name
    }
    return {
      size: pickName('Size', 'Medium') ?? 'Medium',
      temperature: pickName('Temperature', 'Cold') ?? 'Cold',
      ice: pickName('Ice', 'Normal Ice') ?? 'Normal Ice',
      sweetness: pickName('Sweetness', '100% (Regular) Sweetness') ?? '100% (Regular) Sweetness',
      milk: isMilkEligible ? (pickName('Milk', 'Whole Milk') ?? 'Whole Milk') : undefined,
      toppings: [],
      boba: isMilkEligible ? 'Regular Boba' : '',
    }
  }

  function buildChatCustomization(item: MenuItem, sel: ChatSelections): { customString: string; totalPrice: number; cartId: string } {
    const cat = (item.category || '').toLowerCase()
    const isMilkEligible = ['milk tea', 'fruit tea', 'specialty'].includes(cat)
    const c = customizationsByCategory

    const sizeUpcharge = c['Size']?.find(o => o.name === sel.size)?.price ?? 0
    const milkUpcharge = isMilkEligible && sel.milk
      ? (c['Milk']?.find(o => o.name === sel.milk)?.price ?? 0)
      : 0
    const toppingsCost = (sel.toppings ?? []).reduce((sum, name) => {
      return sum + (c['Topping']?.find(o => o.name === name)?.price ?? 0)
    }, 0)
    const bobaCost = sel.boba === 'Extra Boba' ? 1.00 : sel.boba === 'Regular Boba' ? 0.50 : 0
    const totalPrice = item.price + sizeUpcharge + milkUpcharge + toppingsCost + bobaCost

    const parts: string[] = []
    if (sel.temperature) parts.push(sel.temperature)
    if (sel.size) parts.push(sel.size)
    if (sel.ice) parts.push(sel.ice)
    if (sel.sweetness) parts.push(sel.sweetness)
    if (isMilkEligible && sel.milk) parts.push(sel.milk)
    if (sel.toppings && sel.toppings.length) parts.push(sel.toppings.join(', '))
    if (sel.boba === 'Extra Boba') {
      parts.push('Regular Boba')
      parts.push('Extra Boba')
    } else if (sel.boba) {
      parts.push(sel.boba)
    }
    const customString = parts.join(', ')
    const cartId = `${item.itemid}-${customString}`
    return { customString, totalPrice, cartId }
  }

  function addToCartFromChat(item: MenuItem, selections?: ChatSelections): string {
    if ((item.category || '').toLowerCase().includes('snack')) {
      const cartId = `${item.itemid}-no-customization`
      setCart(prev => {
        const existing = prev.find(o => o.cartId === cartId)
        if (existing) {
          return prev.map(o => (o.cartId === cartId ? { ...o, qty: o.qty + 1 } : o))
        }
        return [...prev, { itemId: item.itemid, itemName: item.itemname, price: item.price, qty: 1, cartId }]
      })
      setAddedNotification(item.itemname)
      setTimeout(() => setAddedNotification(null), 2000)
      return cartId
    }

    const sel = selections ?? getDefaultChatSelections(item)
    const { customString, totalPrice, cartId } = buildChatCustomization(item, sel)
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
          price: totalPrice,
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

  function modifyChatCartLine(oldCartId: string, item: MenuItem, selections: ChatSelections): string | null {
    const { customString, totalPrice, cartId: newCartId } = buildChatCustomization(item, selections)
    if (newCartId === oldCartId) return oldCartId
    let resultId: string | null = null
    setCart(prev => {
      const line = prev.find(o => o.cartId === oldCartId)
      if (!line) return prev
      resultId = newCartId
      const withoutOld = prev.filter(o => o.cartId !== oldCartId)
      const existing = withoutOld.find(o => o.cartId === newCartId)
      if (existing) {
        return withoutOld.map(o =>
          o.cartId === newCartId ? { ...o, qty: o.qty + line.qty } : o
        )
      }
      return [
        ...withoutOld,
        { ...line, price: totalPrice, customizations: customString, cartId: newCartId },
      ]
    })
    return resultId
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
      setCart([])
      setOrderResult({
        saleId: data.saleId,
        total: Number(data.total),
        queueMinutes: data.queueMinutes ?? 0,
      })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setOrderResult(null)
      }, 8000)
    } catch (error) {
      console.error('Order Error:', error)
      alert('Could not submit order. Please check your network connectivity and try again.')
    }
  }

  return (
    <div
      ref={kioskRef}
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: `calc(16px * var(--text-scale))`,
      }}
      className="kiosk-theme flex h-screen font-sans"
    >
      <ChatWidget
        menuItems={items}
        cart={cart}
        weather={weather}
        customizationsByCategory={customizationsByCategory}
        onAddToCart={addToCartFromChat}
        onModifyCartLine={modifyChatCartLine}
        onSelectCategory={setSelectedCategory}
        textSize={textSize}
        highContrast={highContrast}
      />

      {/* Order Success Overlay */}
      {submitted && orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="rounded-3xl p-10 w-[420px] max-w-[90vw] shadow-2xl border-2 flex flex-col items-center gap-6 text-center"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--button-success-text)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="text-6xl">✓</div>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--button-success-text)' }}>
              Order Placed!
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Total: <strong>${orderResult.total.toFixed(2)}</strong>
            </p>
            {orderResult.queueMinutes > 0 && (
              <div
                className="rounded-2xl px-8 py-5 border-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--accent-color)',
                }}
              >
                <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                  Estimated Wait
                </p>
                <p className="text-5xl font-bold" style={{ color: 'var(--accent-color)' }}>
                  ~{orderResult.queueMinutes} min
                </p>
              </div>
            )}
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              This screen will close automatically
            </p>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="rounded-2xl p-8 w-[750px] shadow-xl border-2 overflow-y-auto max-h-[90vh]" style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--card-border)',
            color: 'var(--card-text)'
          }}>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="text-2xl font-bold">{customizingItem.itemname}</h2>
              <p style={{ color: 'var(--text-muted)' }}>Customize your drink</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-3">Drink Size</label>
                  <select 
                    value={drinkSize} 
                    onChange={(e) => setDrinkSize(e.target.value)}
                    className="w-full p-3 rounded-lg border text-sm" 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--input-text)'
                    }}
                  >
                    {customizationsByCategory['Size']?.map(opt => (
                      <option key={opt.customizationid} value={opt.name}>
                        {opt.name}{opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {!['refresher', 'slush'].includes((customizingItem?.category || '').toLowerCase()) && (
                  <div>
                    <label className="block text-sm font-semibold mb-3">Temperature</label>
                    <select 
                      value={drinkTemp} 
                      onChange={(e) => setDrinkTemp(e.target.value)}
                      className="w-full p-3 rounded-lg border text-sm"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--input-text)'
                      }}
                    >
                      {customizationsByCategory['Temperature']?.map(opt => (
                        <option key={opt.customizationid} value={opt.name}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-3">Ice Level</label>
                  <select 
                    value={iceLevel} 
                    onChange={(e) => setIceLevel(e.target.value)}
                    className="w-full p-3 rounded-lg border text-sm"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--input-text)'
                    }}
                  >
                    {customizationsByCategory['Ice']?.map(opt => (
                      <option key={opt.customizationid} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-3">Sugar Level</label>
                  <select 
                    value={sugarLevel} 
                    onChange={(e) => setSugarLevel(e.target.value)}
                    className="w-full p-3 rounded-lg border text-sm"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--input-text)'
                    }}
                  >
                    {customizationsByCategory['Sweetness']?.sort((a, b) => {
                      const orderMap: { [key: string]: number } = { '0% Sweetness': 0, '20% Sweetness': 1, '50% Sweetness': 2, '100% (Regular) Sweetness': 3, '120% Sweetness': 4 };
                      return (orderMap[a.name] ?? 999) - (orderMap[b.name] ?? 999);
                    }).map(opt => (
                      <option key={opt.customizationid} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {['milk tea', 'fruit tea', 'specialty'].includes((customizingItem?.category || '').toLowerCase()) && (
                  <div>
                    <label className="block text-sm font-semibold mb-3">Milk</label>
                    <select 
                      value={milkAlt} 
                      onChange={(e) => setMilkAlt(e.target.value)}
                      className="w-full p-3 rounded-lg border text-sm"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--input-text)'
                      }}
                    >
                      {customizationsByCategory['Milk']?.map(opt => (
                        <option key={opt.customizationid} value={opt.name}>
                          {opt.name}{opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {['milk tea', 'fruit tea', 'specialty'].includes((customizingItem?.category || '').toLowerCase()) && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-3">Toppings</label>
                    <div className="grid grid-cols-3 gap-3">
                      {customizationsByCategory['Topping']?.filter(topping => 
                        topping.name !== 'Tapioca Pearls (Boba)' && topping.name !== 'Extra Boba'
                      ).map(topping => (
                        <button
                          key={topping.customizationid}
                          type="button"
                          onClick={() => {
                            setSelectedToppings(prev =>
                              prev.includes(topping.name)
                                ? prev.filter(t => t !== topping.name)
                                : [...prev, topping.name]
                            )
                          }}
                          className="rounded-lg border p-2 text-sm font-medium transition-colors"
                          style={{
                            borderColor: selectedToppings.includes(topping.name) ? 'var(--accent-color)' : 'var(--card-border)',
                            backgroundColor: selectedToppings.includes(topping.name) ? 'var(--accent-color)' : 'var(--card-bg)',
                            color: selectedToppings.includes(topping.name) ? '#ffffff' : 'var(--card-text)'
                          }}
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className="text-sm"
                              style={{
                                color: selectedToppings.includes(topping.name) ? '#ffffff' : 'var(--card-text)',
                                fontWeight: selectedToppings.includes(topping.name) ? '600' : '500'
                              }}
                            >
                              {topping.name}
                            </span>
                            {topping.price > 0 && (
                              <span
                                className="text-xs mt-0.5"
                                style={{
                                  opacity: selectedToppings.includes(topping.name) ? 0.95 : 0.75,
                                  color: selectedToppings.includes(topping.name) ? '#ffffff' : 'var(--card-text)'
                                }}
                              >
                                +${topping.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Boba</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'Regular Boba' as const, emoji: '🧋', label: 'Regular', price: 0.50 },
                        { value: 'Extra Boba' as const, emoji: '🧋+', label: 'Extra', price: 1.00 },
                        { value: 'No Boba' as const, emoji: '🚫🧋', label: 'None', price: 0.00 },
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={bobaOption === option.value}
                          onClick={() => setBobaOption(option.value)}
                          className="rounded-lg border p-2 flex flex-col items-center justify-center transition-colors"
                          style={{
                            borderColor: bobaOption === option.value ? 'var(--accent-color)' : 'var(--card-border)',
                            backgroundColor: bobaOption === option.value ? 'var(--accent-color)' : 'var(--card-bg)',
                            color: bobaOption === option.value ? '#ffffff' : 'var(--card-text)'
                          }}
                        >
                          <span className="text-lg">{option.emoji}</span>
                          <span 
                            className="text-xs mt-1 font-medium"
                            style={{
                              color: bobaOption === option.value ? '#ffffff' : 'var(--card-text)',
                              fontWeight: bobaOption === option.value ? '600' : '500'
                            }}
                          >
                            {option.label}
                          </span>
                          {option.price > 0 && (
                            <span 
                              className="text-xs mt-0.5"
                              style={{
                                opacity: bobaOption === option.value ? 0.95 : 0.75,
                                color: bobaOption === option.value ? '#ffffff' : 'var(--card-text)'
                              }}
                            >
                              +${option.price.toFixed(2)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
                {(() => {
                  const baseCost = customizingItem?.price ?? 0
                  const sizeUpcharge = customizationsByCategory['Size']?.find(s => s.name === drinkSize)?.price ?? 0
                  const milkUpcharge = ['milk tea', 'fruit tea', 'specialty'].includes((customizingItem?.category || '').toLowerCase()) 
                    ? (customizationsByCategory['Milk']?.find(m => m.name === milkAlt)?.price ?? 0)
                    : 0
                  const toppingsCost = selectedToppings.reduce((sum, toppingName) => {
                    const topping = customizationsByCategory['Topping']?.find(t => t.name === toppingName)
                    return sum + (topping?.price ?? 0)
                  }, 0)
                  const bobaCost = bobaOption === 'Extra Boba' ? 1.00 : bobaOption === 'Regular Boba' ? 0.50 : 0
                  const totalPrice = baseCost + sizeUpcharge + milkUpcharge + toppingsCost + bobaCost
                  return `Add to Cart — $${totalPrice.toFixed(2)}`
                })()}
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
              {selectedCategory ? selectedCategory : 'AggTea Kiosk'}
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

          {session?.user ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {session.user.image && (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              )}
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ redirect: false })}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in
            </button>
          )}
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
                  className="rounded-2xl border-2 p-8 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--card-text)',
                    boxShadow: '0 4px 16px rgba(46, 42, 40, 0.06)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#500000'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(80, 0, 0, 0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(46, 42, 40, 0.06)' }}
                >
                  <p className="font-bold text-2xl leading-snug">{cat}</p>
                  {categoryDescriptions[cat] && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{categoryDescriptions[cat]}</p>
                  )}
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>{items.filter(i => i.category === cat).length} items</p>
                </button>
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No items available</p>
            </div>
          ) : (
            // Show items for selected category
            <div className="grid grid-cols-3 gap-6">
              {visibleItems.map(item => (
                <button
                  key={item.itemid}
                  onClick={() => openCustomization(item)}
                  // ADDED: flex flex-col to stack the image, text, and price
                  className="rounded-2xl border-2 p-6 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 flex flex-col"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--card-text)',
                    boxShadow: '0 4px 16px rgba(46, 42, 40, 0.06)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#500000'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(80, 0, 0, 0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(46, 42, 40, 0.06)' }}
                >                
                  {item.image ? (
                    <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-black/5 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.itemname}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 mb-4 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <span className="text-4xl opacity-50">🧋</span>
                    </div>
                  )}
                 
                  <p className="font-bold text-lg leading-snug">{item.itemname}</p>
                  
                  {item.description && (
                    <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                  )}
                  
                  {/* ADDED: mt-auto to push the price to the bottom if descriptions vary in length */}
                  <p className="mt-auto pt-4 font-bold text-xl" style={{ color: 'var(--accent-color)' }}>${item.price.toFixed(2)}</p>
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
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Your Cart</h2>
        </header>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center mt-12">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Your cart is empty</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Tap a drink to get started, or ask the assistant for help.</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.cartId}
                className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 2px 8px rgba(46, 42, 40, 0.04)',
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
                  <span className="w-8 text-center font-semibold" style={{ color: 'var(--text-primary)' }}>{item.qty}</span>
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
              Order placed!{orderResult?.queueMinutes ? ` Ready in ~${orderResult.queueMinutes} min` : ''}
            </div>
          )}

          <div className="rounded-lg p-4 border" style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)'
          }}>
            <div className="flex justify-between items-center">
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-light" style={{ color: 'var(--text-muted)' }}>Tax (8.25%)</span>
              <span className="font-light" >${cartTax.toFixed(2)}</span>
            </div>

            <div className="border-t mt-3 pt-3 flex justify-between items-center" style={{
              borderColor: 'var(--card-border)'
            }}>
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--accent-color)' }}>${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={submitOrder}
            disabled={cart.length === 0}
            className="w-full py-4 rounded-xl font-bold text-lg
                       hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-primary-text)',
              boxShadow: cart.length > 0 ? '0 4px 14px rgba(80, 0, 0, 0.3)' : 'none',
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
        <div
          className="fixed inset-0 z-50 flex items-end justify-start"
          onClick={() => setAccessibilityOpen(false)}
        >
          <div
            className="rounded-2xl p-6 w-80 shadow-xl border-2 m-6"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--card-border)',
              color: 'var(--text-primary)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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

              {/* Screen Reader Toggle */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Screen Reader
                  <span className="block text-xs font-normal mt-1 opacity-80">
                    (Tap once to read, double-tap to select)
                  </span>
                </label>
                <button
                  onClick={() => setScreenReaderEnabled(!screenReaderEnabled)}
                  className={`w-full py-3 rounded-lg font-medium transition-colors cursor-pointer border-2`}
                  style={{
                    backgroundColor: screenReaderEnabled ? 'var(--button-primary-bg)' : 'var(--button-secondary-bg)',
                    color: screenReaderEnabled ? 'var(--button-primary-text)' : 'var(--button-secondary-text)',
                    borderColor: screenReaderEnabled ? 'var(--button-primary-bg)' : 'var(--card-border)'
                  }}
                >
                  {screenReaderEnabled ? '✓ On' : 'Off'}
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

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-[360px] shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Sign in</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <QRLoginSection onSuccess={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

interface Customization {
  customizationid: number
  name: string
  category: string
  price: number
  ingredients?: string
  isactive: boolean
}