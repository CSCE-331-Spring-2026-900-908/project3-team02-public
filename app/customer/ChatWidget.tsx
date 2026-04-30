'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuItem, OrderItem, ChatSelections, ChatBobaOption, ChatCustomization } from './types'

// Bot-facing update shape. Keys mirror ChatSelections plus a legacy `sugar`
// alias so older prompt outputs still apply. `addTopping`/`removeTopping`
// let the bot do delta changes without knowing the current full list.
type CustomizationUpdate = {
  size?: string
  temperature?: string
  ice?: string
  sweetness?: string
  sugar?: string
  milk?: string
  toppings?: string[]
  addTopping?: string
  removeTopping?: string
  boba?: ChatBobaOption
}

type ChatButton =
  | { label: string; action: 'add_item'; itemId: number }
  | { label: string; action: 'show_category'; category: string }
  | { label: string; action: 'send_message'; messageText: string }
  | { label: string; action: 'modify_item'; update: CustomizationUpdate }
  | { label: string; action: 'checkout' }

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
  customizationsByCategory?: Record<string, ChatCustomization[]>
  onAddToCart: (item: MenuItem, selections?: ChatSelections) => string
  onModifyCartLine: (oldCartId: string, item: MenuItem, selections: ChatSelections) => string | null
  onSelectCategory: (category: string) => void
  onRequestClose?: () => void
  textSize?: string
  highContrast?: boolean
}

type LastAdded = {
  cartId: string
  itemId: number
  itemName: string
  drinkCategory: string
  selections: ChatSelections
}

function defaultSelectionsFor(
  item: MenuItem,
  _c: Record<string, ChatCustomization[]>
): ChatSelections {
  // Match the modal's hardcoded initial-state literals so chat-added defaults
  // and modal-added defaults produce the same customString and merge in cart.
  const cat = (item.category || '').toLowerCase()
  const isMilkEligible = ['milk tea', 'fruit tea', 'specialty'].includes(cat)
  return {
    size: 'Medium',
    temperature: 'Cold',
    ice: 'Normal Ice',
    sweetness: '100% (Regular) Sweetness',
    milk: isMilkEligible ? 'Whole Milk' : undefined,
    toppings: [],
    boba: isMilkEligible ? 'Regular Boba' : '',
  }
}

function applyUpdate(prev: ChatSelections, update: CustomizationUpdate): ChatSelections {
  const next: ChatSelections = { ...prev }
  if (update.size !== undefined) next.size = update.size
  if (update.temperature !== undefined) next.temperature = update.temperature
  if (update.ice !== undefined) next.ice = update.ice
  // Accept either the new "sweetness" key or the legacy "sugar" alias.
  if (update.sweetness !== undefined) next.sweetness = update.sweetness
  else if (update.sugar !== undefined) next.sweetness = update.sugar
  if (update.milk !== undefined) next.milk = update.milk
  if (update.toppings !== undefined) next.toppings = update.toppings
  if (update.addTopping) {
    const cur = next.toppings ?? []
    if (!cur.includes(update.addTopping)) next.toppings = [...cur, update.addTopping]
  }
  if (update.removeTopping) {
    next.toppings = (next.toppings ?? []).filter(t => t !== update.removeTopping)
  }
  if (update.boba !== undefined) next.boba = update.boba
  return next
}

export default function ChatWidget({ menuItems, cart, weather, customizationsByCategory, onAddToCart, onModifyCartLine, onSelectCategory, onRequestClose, textSize, highContrast }: ChatWidgetProps) {
  const customizations = customizationsByCategory ?? {}
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null)
  const lastAddedRef = useRef<LastAdded | null>(null)
  useEffect(() => {
    lastAddedRef.current = lastAdded
  }, [lastAdded])

  function selectionsForAdd(item: MenuItem): ChatSelections {
    const prev = lastAddedRef.current
    if (prev && prev.itemId === item.itemid) {
      return { ...prev.selections, toppings: [...(prev.selections.toppings ?? [])] }
    }
    return defaultSelectionsFor(item, customizations)
  }
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    setSpeechSupported(true)
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition
  }, [])

  function startListening() {
    const recognition = recognitionRef.current
    if (!recognition || isListening) return
    setInputText('')
    setIsListening(true)

    let finalTranscript = ''
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim += transcript
        }
      }
      setInputText(finalTranscript + interim)
    }
    recognition.onerror = (event: any) => {
      // 'no-speech' and 'aborted' are benign — user tapped mic without speaking
      // or manually stopped. Only warn on real failures.
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Speech recognition error:', event.error)
      }
      setIsListening(false)
    }
    recognition.onend = () => {
      setIsListening(false)
      const toSend = finalTranscript.trim()
      if (toSend) {
        handleSendText(toSend)
      }
    }
    try {
      recognition.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      setIsListening(false)
    }
  }

  function stopListening() {
    const recognition = recognitionRef.current
    if (recognition && isListening) {
      recognition.stop()
    }
  }
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

  const GREETING_MESSAGE: ChatMessage = {
    role: 'assistant',
    content: "Hi! I can help you find a drink fast. What sounds good?",
    buttons: [
      { label: 'Best sellers', action: 'send_message', messageText: 'Show me your best sellers' },
      { label: 'Help me choose', action: 'send_message', messageText: 'Help me choose a drink' },
      { label: 'Something fruity', action: 'send_message', messageText: 'I want something fruity' },
      { label: 'Something creamy', action: 'send_message', messageText: 'I want something creamy' },
    ],
  }

  function resetConversation() {
    setMessages([GREETING_MESSAGE])
    setInputText('')
  }

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true)
      setMessages([GREETING_MESSAGE])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const actions = data.cartActions.slice(0, 3)
        for (const action of actions) {
          if (action.type === 'add') {
            const match = menuItems.find(i => i.itemid === action.itemId)
            if (match) {
              const sel = selectionsForAdd(match)
              const newCartId = onAddToCart(match, sel)
              setLastAdded({
                cartId: newCartId,
                itemId: match.itemid,
                itemName: match.itemname,
                drinkCategory: match.category,
                selections: sel,
              })
            }
          } else if (action.type === 'modify') {
            const prev = lastAddedRef.current
            if (!prev) continue
            const item = menuItems.find(i => i.itemid === prev.itemId)
            if (!item) continue
            const newSelections = applyUpdate(prev.selections, action.update ?? {})
            const newCartId = onModifyCartLine(prev.cartId, item, newSelections)
            if (newCartId) {
              setLastAdded({ ...prev, cartId: newCartId, selections: newSelections })
            }
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
      if (!match) return
      const sel = selectionsForAdd(match)
      const newCartId = onAddToCart(match, sel)
      setLastAdded({
        cartId: newCartId,
        itemId: match.itemid,
        itemName: match.itemname,
        drinkCategory: match.category,
        selections: sel,
      })
      const next: ChatMessage[] = [
        ...messages,
        { role: 'user', content: `I just added ${match.itemname} to my cart.` },
      ]
      setMessages(next)
      const projected: OrderItem[] = [
        ...cartRef.current,
        {
          itemId: match.itemid,
          itemName: match.itemname,
          price: match.price,
          qty: 1,
          customizations: '',
          cartId: `chat-${match.itemid}`,
        },
      ]
      sendToApi(next, { skipCartActions: true, cartOverride: projected })
    } else if (button.action === 'modify_item') {
      if (!lastAdded) return
      const item = menuItems.find(i => i.itemid === lastAdded.itemId)
      if (!item) return
      const newSelections = applyUpdate(lastAdded.selections, button.update)
      const newCartId = onModifyCartLine(lastAdded.cartId, item, newSelections)
      if (!newCartId) return
      setLastAdded({
        ...lastAdded,
        cartId: newCartId,
        selections: newSelections,
      })
      const next: ChatMessage[] = [
        ...messages,
        { role: 'user', content: `${button.label} on my ${lastAdded.itemName}.` },
      ]
      setMessages(next)
      sendToApi(next)
    } else if (button.action === 'checkout') {
      setIsOpen(false)
      if (onRequestClose) onRequestClose()
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
        className="fixed bottom-6 right-[416px] z-40 w-16 h-16 rounded-full bg-[#500000] text-white shadow-lg hover:bg-[#651111] transition-colors cursor-pointer flex items-center justify-center text-3xl"
        aria-label="Open chat assistant"
      >
        💬
      </button>
    )
  }

  const latestButtons = messages.length > 0 ? messages[messages.length - 1].buttons ?? [] : []

  return (
    <div className="fixed bottom-6 right-[416px] z-40 w-96 h-[540px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <header className="px-4 py-3 bg-[#500000] text-white flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold" style={{ color: '#F8F4EF' }}>AggTea Assistant</p>
          <p className="text-xs" style={{ color: 'rgba(248,244,239,0.8)' }}>Need help choosing a drink?</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={resetConversation}
            disabled={messages.length <= 1}
            className="px-2 h-8 rounded-full hover:bg-[#651111] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center text-xs font-semibold"
            aria-label="Start over"
            title="Start over"
          >
            ↶ Start over
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-[#651111] transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-[#500000] text-white rounded-br-sm'
                  : 'rounded-bl-sm border'
              }`}
              style={msg.role !== 'user' ? { backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' } : undefined}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>
              <span className="inline-block animate-pulse">● ● ●</span>
            </div>
          </div>
        )}
      </div>

      {latestButtons.length > 0 && !isLoading && (
        <div className="px-3 py-2 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
          {latestButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => handleButtonClick(btn)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border hover:opacity-80 transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--bg-secondary)', color: '#500000', borderColor: '#500000' }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {speechSupported && (
        <div className="px-3 py-2 border-t flex gap-2 items-center" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
          <div
            className="flex-1 px-3 py-2 text-sm rounded-full border truncate select-none"
            style={{ borderColor: 'var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}
            aria-live="polite"
          >
            {isListening ? (inputText || 'Listening...') : 'Tap the mic to speak'}
          </div>
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            title={isListening ? 'Stop listening' : 'Tap to speak'}
          >
            🎤
          </button>
        </div>
      )}
    </div>
  )
}
