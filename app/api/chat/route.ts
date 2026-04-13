import Anthropic from '@anthropic-ai/sdk'
import { MENU_ITEMS } from '../../data/menu'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function buildMenuSection(): string {
  const byCategory = new Map<string, typeof MENU_ITEMS>()
  for (const item of MENU_ITEMS) {
    const list = byCategory.get(item.category) || []
    list.push(item)
    byCategory.set(item.category, list)
  }

  let menu = ''
  for (const [category, items] of byCategory) {
    menu += `\n### ${category}\n`
    for (const item of items) {
      menu += `- ${item.itemname} (ID: ${item.itemid}) - $${item.price.toFixed(2)}\n`
    }
  }
  return menu
}

const SYSTEM_PROMPT = `You are a decision-helper for a bubble tea shop. Customers can already browse categories on the menu UI by themselves — your job is NOT to read the menu to them. Your job is to help them figure out what THEY want and then commit to a specific drink.

## YOUR ROLE
- Ask about mood, flavor preference, texture, or craving — not categories.
- Recommend specific drinks by name with a one-line "why it fits."
- Use the weather to nudge suggestions (hot/humid → fruity/slush/icy; cool/cold → creamy/milk tea; rainy → cozy/creamy).
- Never list a whole category unless the customer explicitly asks to see one.
- If the customer seems decisive, just commit and suggest one drink. If they're unsure, ask ONE short clarifying question.

## LANGUAGE RULES
- Use decision language: "Want something refreshing or something rich?", "In the mood for fruity or creamy?", "Feeling adventurous?"
- Avoid menu language: do NOT say "We have Milk Tea, Fruit Tea, Slush, and Special" or "Browse our categories."
- Keep replies to 1-2 sentences max.

## MENU (internal reference — do not recite)
${buildMenuSection()}

## RESPONSE FORMAT
You MUST respond with valid JSON in this exact format and nothing else:
{
  "message": "Your friendly response text here",
  "buttons": [
    {"label": "Button text", "action": "add_item", "itemId": 1},
    {"label": "Button text", "action": "send_message", "messageText": "Something fruity"},
    {"label": "Button text", "action": "show_category", "category": "Milk Tea"}
  ],
  "cartActions": []
}

## BUTTON RULES
- Always include 2-4 buttons that push the decision forward.
- Prefer decision-oriented send_message buttons ("Something fruity", "Something creamy", "Surprise me", "Best seller", "Help me choose") and specific add_item buttons for concrete recommendations.
- Only use show_category buttons if the customer explicitly asked to see a category.
- When you recommend a drink, include an add_item button for it.
- After an add, offer a pairing/second-drink suggestion or "I'm done" style button — do not re-list categories.

## CART ACTION RULES
- Only include cartActions when the customer explicitly confirms they want to add something.
- Each cart action needs: type "add", itemId (number), itemName (string), price (number). Must match a real item.
- Do NOT include cartActions just because you recommended a drink — wait for the customer to confirm.
- The "CUSTOMER'S CURRENT CART" section is the AUTHORITATIVE current state and already reflects any add the user just confirmed. Do NOT add to those counts when the user's latest message says "I just added X" — that add is already in the cart summary. Read counts directly from the cart summary.

## PERSONALITY
- Concise, warm, a little playful. 1-2 sentences.
- If asked about ingredients/allergens, say you don't have detailed info and suggest asking staff.
- Do NOT wrap your response in markdown code blocks — return raw JSON only.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface WeatherContext {
  temperatureF?: number
  highF?: number
  lowF?: number
}

interface ChatRequest {
  messages: ChatMessage[]
  cartSummary?: string
  weather?: WeatherContext
}

const FALLBACK_BUTTONS = [
  { label: 'Something fruity', action: 'send_message' as const, messageText: 'I want something fruity and refreshing' },
  { label: 'Something creamy', action: 'send_message' as const, messageText: 'I want something creamy' },
  { label: 'Help me choose', action: 'send_message' as const, messageText: 'Help me pick a drink' },
]

function describeWeather(w?: WeatherContext): string {
  if (!w || typeof w.temperatureF !== 'number') return 'Unknown'
  const t = w.temperatureF
  let vibe = 'mild'
  if (t >= 80) vibe = 'hot — lean toward fruity, slush, or icy drinks'
  else if (t >= 68) vibe = 'warm — either refreshing or creamy works'
  else if (t >= 55) vibe = 'cool — creamy milk teas feel cozy'
  else vibe = 'cold — lean toward warm/creamy milk teas'
  const range = w.highF != null && w.lowF != null ? ` (H ${w.highF.toFixed(0)}° / L ${w.lowF.toFixed(0)}°)` : ''
  return `${t.toFixed(0)}°F${range} — ${vibe}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest
    const messages = body.messages ?? []

    if (!messages.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    const cartLine = body.cartSummary && body.cartSummary !== 'Empty'
      ? body.cartSummary
      : 'Empty - nothing ordered yet'
    const systemPrompt = `${SYSTEM_PROMPT}\n\n## CURRENT WEATHER\n${describeWeather(body.weather)}\n\n## CUSTOMER'S CURRENT CART\n${cartLine}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const textBlock = response.content.find(block => block.type === 'text')
    const rawText = textBlock?.text ?? ''

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()

    try {
      const parsed = JSON.parse(cleaned)
      return Response.json({
        message: parsed.message ?? rawText,
        buttons: parsed.buttons ?? FALLBACK_BUTTONS,
        cartActions: parsed.cartActions ?? [],
      })
    } catch {
      // If JSON parsing fails, return the raw text with fallback buttons
      return Response.json({
        message: rawText,
        buttons: FALLBACK_BUTTONS,
        cartActions: [],
      })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      {
        message: "Sorry, I'm having trouble right now. Please try again or browse the menu directly!",
        buttons: FALLBACK_BUTTONS,
        cartActions: [],
      },
      { status: 500 }
    )
  }
}
