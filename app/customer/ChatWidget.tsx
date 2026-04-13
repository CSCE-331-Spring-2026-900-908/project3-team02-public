'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuItem, OrderItem } from './types'

type ChatButton =
  | { label: string; action: 'add_item'; itemId: number }
  | { label: string; action: 'show_category'; category: string }
  | { label: string; action: 'send_message'; messageText: string }

type CartAction = {
  type: 'add'
  itemId: number
  itemName: string
  price: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  buttons?: ChatButton[]
}

interface WeatherContext {
  temperatureF?: number
  highF?: number
  lowF?: number
}

interface ChatWidgetProps {
  menuItems: MenuItem[]
  cart: OrderItem[]
  weather?: any
  onAddToCart: (item: MenuItem) => void
  onSelectCategory: (category: string) => void
}

export default function ChatWidget({ menuItems, cart, weather, onAddToCart, onSelectCategory }: ChatWidgetProps) {
  const weatherContext: WeatherContext | undefined = weather?.current?.temperature != null
    ? {
        temperatureF: weather.current.temperature,
        highF: weather.daily?.temperature_2m_max?.[0],
        lowF: weather.daily?.temperature_2m_min?.[0],
      }
    : undefined
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputText, setInputText] = useState('')
  const [hasGreeted, setHasGreeted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef(cart)
  useEffect(() => {
    cartRef.current = cart
  }, [cart])

  function summarizeCart(items: OrderItem[]): string {
    if (items.length === 0) return 'Empty'
    const counts = new Map<string, number>()
    for (const o of items) {
      counts.set(o.itemName, (counts.get(o.itemName) ?? 0) + o.qty)
    }
    return Array.from(counts.entries())
      .map(([name, qty]) => `${name} x${qty}`)
      .join(', ')
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true)
      sendToApi(
        [
          {
            role: 'user',
            content:
              "Hi! I just walked up to the kiosk and I'm not sure what I want yet. Greet me briefly and offer decision-oriented starter buttons like \"Best seller\", \"Help me choose\", \"Something fruity\", \"Something creamy\", or a weather-based pick — do NOT list categories.",
          },
        ],
        { isGreeting: true }
      )
    }
  }, [isOpen, hasGreeted])

  async function sendToApi(
    history: ChatMessage[],
    options: { isGreeting?: boolean; skipCartActions?: boolean; cartOverride?: OrderItem[] } = {}
  ) {
    const { isGreeting = false, skipCartActions = false, cartOverride } = options
    setIsLoading(true)
    try {
      const cartForSummary = cartOverride ?? cartRef.current
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
          cartSummary: summarizeCart(cartForSummary),
          weather: weatherContext,
        }),
      })
      const data = await response.json()

      if (!skipCartActions && Array.isArray(data.cartActions)) {
        for (const action of data.cartActions as CartAction[]) {
          if (action.type === 'add') {
            const match = menuItems.find(i => i.itemid === action.itemId)
            if (match) onAddToCart(match)
          }
        }
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message ?? '',
        buttons: data.buttons ?? [],
      }

      setMessages(isGreeting ? [assistantMessage] : [...history, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble right now. Try browsing the menu directly!",
          buttons: [],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSendText(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setInputText('')
    sendToApi(next)
  }

  function handleButtonClick(button: ChatButton) {
    if (isLoading) return
    if (button.action === 'add_item') {
      const match = menuItems.find(i => i.itemid === button.itemId)
      if (match) onAddToCart(match)
      const next: ChatMessage[] = [
        ...messages,
        { role: 'user', content: `I just added ${match?.itemname ?? 'that item'} to my cart.` },
      ]
      setMessages(next)
      const projected: OrderItem[] = match
        ? [
            ...cartRef.current,
            {
              itemId: match.itemid,
              itemName: match.itemname,
              price: match.price,
              qty: 1,
              customizations: 'Medium, Normal Ice, 100% Sugar, Regular Boba',
              cartId: `chat-${match.itemid}`,
            },
          ]
        : cartRef.current
      sendToApi(next, { skipCartActions: true, cartOverride: projected })
    } else if (button.action === 'show_category') {
      onSelectCategory(button.category)
      const next: ChatMessage[] = [
        ...messages,
        { role: 'user', content: `Show me ${button.category}` },
      ]
      setMessages(next)
      sendToApi(next)
    } else if (button.action === 'send_message') {
      handleSendText(button.messageText)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-[416px] z-40 w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center text-3xl"
        aria-label="Open chat assistant"
      >
        💬
      </button>
    )
  }

  const latestButtons = messages.length > 0 ? messages[messages.length - 1].buttons ?? [] : []

  return (
    <div className="fixed bottom-6 right-[416px] z-40 w-96 h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      <header className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between">
        <div>
          <p className="font-bold">Personal Assistant</p>
          <p className="text-xs text-blue-100">Ask me about drinks!</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-full hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Close chat"
        >
          ✕
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-500 border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
              <span className="inline-block animate-pulse">● ● ●</span>
            </div>
          </div>
        )}
      </div>

      {latestButtons.length > 0 && !isLoading && (
        <div className="px-3 py-2 border-t border-gray-200 bg-white flex flex-wrap gap-2">
          {latestButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => handleButtonClick(btn)}
              className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      <div className="px-3 py-2 border-t border-gray-200 bg-white flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSendText(inputText)
          }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleSendText(inputText)}
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  )
}
