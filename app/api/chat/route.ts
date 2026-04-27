import Anthropic from '@anthropic-ai/sdk'
import { MENU_ITEMS } from '../../data/menu'
import { BESTSELLER_IDS, getTags, isBestseller } from '../../data/drinkTags'
import { pool } from '../../../lib/db'
import { MenuItem } from '../../customer/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function loadMenu(): Promise<MenuItem[]> {
  try {
    const result = await pool.query(
      `SELECT itemid, itemname, price, category, description FROM items WHERE isactive = true ORDER BY category, itemname`
    )
    if (result.rows.length === 0) return MENU_ITEMS
    return result.rows.map((r: any) => ({
      itemid: r.itemid,
      itemname: r.itemname,
      price: Number(r.price),
      category: r.category,
      description: r.description ?? '',
      image: r.image ?? null,
    }))
  } catch (error) {
    console.error('Chat API: items query failed, using hardcoded fallback:', error)
    return MENU_ITEMS
  }
}

function buildMenuSection(items: MenuItem[]): string {
  const byCategory = new Map<string, MenuItem[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) || []
    list.push(item)
    byCategory.set(item.category, list)
  }

  let menu = ''
  for (const [category, catItems] of byCategory) {
    menu += `\n### ${category}\n`
    for (const item of catItems) {
      const tags = getTags(item.itemid)
      const tagStr = tags.length ? ` [${tags.join(', ')}]` : ''
      const star = isBestseller(item.itemid) ? ' ★BESTSELLER' : ''
      menu += `- ${item.itemname} (ID: ${item.itemid}) - $${item.price.toFixed(2)}${tagStr}${star}\n`
    }
  }
  return menu
}

function buildBestsellerLine(items: MenuItem[]): string {
  const names = BESTSELLER_IDS
    .map(id => items.find(i => i.itemid === id)?.itemname)
    .filter(Boolean)
  return names.length ? names.join(', ') : 'none configured'
}

const SYSTEM_PROMPT_BASE = `You are a decision-helper for a bubble tea shop. Customers can already browse categories on the menu UI by themselves — your job is NOT to read the menu to them. Your job is to help them figure out what THEY want and then commit to a specific drink.

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

## RESPONSE FORMAT
You MUST respond with valid JSON in this exact format and nothing else:
{
  "message": "Your friendly response text here",
  "buttons": [
    {"label": "Button text", "action": "add_item", "itemId": 1},
    {"label": "Button text", "action": "send_message", "messageText": "Something fruity"},
    {"label": "Button text", "action": "modify_item", "update": {"sugar": "50% Sugar"}},
    {"label": "Button text", "action": "checkout"},
    {"label": "Button text", "action": "show_category", "category": "Milk Tea"}
  ],
  "cartActions": [
    {"type": "add", "itemId": 1, "itemName": "Classic Milk Tea", "price": 5.50}
  ]
}

## BUTTON ACTION TYPES
- **add_item**: {itemId: number} — adds a drink with default customizations. This is the ONLY way to add a drink to the cart. Every concrete drink recommendation MUST be an add_item button.
- **send_message**: {messageText: string} — simulates the customer saying something. Use for narrowing ("Creamy", "Refreshing", "Low sugar") and for follow-up paths. NEVER use send_message for adding a drink — "Add X to cart" style send_message buttons are forbidden. Adds go through add_item only.
- **modify_item**: {update: {size?, ice?, sugar?, boba?}} — modifies the customer's JUST-ADDED drink. Use ONLY right after an add. Allowed values:
  - size: "Medium" | "Large"
  - ice: "Normal Ice" | "Less Ice" | "No Ice"
  - sugar: "100% Sugar" | "75% Sugar" | "50% Sugar" | "25% Sugar" | "0% Sugar"
  - boba: "Regular Boba" | "Extra Boba" | "No Boba"
- **checkout**: no params — closes the chat so the customer can tap Complete Order. Include this when the customer seems done (they said "I'm done", cart has items and they're no longer browsing).
- **show_category**: {category: string} — ONLY if the customer explicitly asked to see a category. Avoid otherwise.

## CONVERSATION FLOW (strict)
Think in 3 layers. Move customers forward fast — NO MORE than 2 questions before showing concrete drinks.
1. **Intent** — what are they trying to do? (find popular / match taste / restriction / quick rec)
2. **Narrow** — ONE short follow-up if needed (creamy vs refreshing? caffeine? sweeter vs lighter?)
3. **Recommend + convert** — name 1-3 specific drinks with a one-line "why it fits", each with an add_item button.

If the customer is already decisive (e.g. "something fruity"), SKIP narrowing and jump straight to 2-3 recommendations.

## BUTTON RULES
- 2-5 buttons per response. Every button must push the decision forward.
- Prefer add_item buttons for concrete drink recommendations — these are the highest-value buttons.
- For narrowing questions, use short send_message buttons ("Creamy", "Refreshing", "Low sugar", "No caffeine", "Surprise me").
- **If your message asks a branching question ("A or B?", "creamy or fruity?", "caffeinated or not?"), you MUST include a button for EVERY option you mention, even if it means hitting the 5-button cap. Never mention a choice in the message without offering a button for it.**
- Short labels only. No "Browse X" or "Show me X category" unless customer explicitly asked.
- **After a successful add** ("I just added X to my cart"), your next buttons MUST be a mix of: (a) 1-2 modify_item buttons tuned to the drink ("Less sweet" → sugar:50%, "Add extra boba" → boba:Extra Boba, "No boba" → boba:No Boba, "Make it large" → size:Large), (b) optionally one snack pairing as add_item (Egg Puff Waffle / Mochi Donut / Spring Roll from the [snack] tagged items), and (c) a checkout action button labeled "I'm done" or "Ready to check out". Never re-list categories.
- Use the [tags] on each menu item to match customer intent (creamy, fruity, refreshing, caffeine-free, first-timer, dessert-like, snack). Prefer ★BESTSELLER items when the customer asks for "popular", "best", or "first-timer".
- When a customer mentions a restriction ("no caffeine", "low sugar", "not too sweet"), filter recommendations using the relevant tag or emit an initial modify_item button. Caffeine-free drinks are marked with the [caffeine-free] tag.

## CART ACTION RULES
- cartActions adds items to the cart. Only emit cartActions when the customer EXPLICITLY confirms they want a specific drink added (e.g. "yes add that", "please add those", "I'll take it").
- Do NOT emit cartActions just because you recommended a drink — wait for explicit confirmation.
- Each cart action: {"type": "add", "itemId": number, "itemName": string, "price": number}. Must match a real menu item.
- Maximum 3 cartActions per response. If the customer asks for more (e.g. "15 mochi donuts"), add up to 3 and tell them to request more if needed.
- When the latest user message says "I just added X to my cart", that add already happened via a button click — do NOT emit a cartAction for it again.
- The "CUSTOMER'S CURRENT CART" section is the AUTHORITATIVE current state. Read counts directly from the cart summary. Do not invent counts.

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

function tryParseChatJson(text: string): { message?: string; buttons?: unknown } | null {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

function extractMessageField(text: string): string | null {
  const match = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (!match) return null
  try {
    return JSON.parse(`"${match[1]}"`)
  } catch {
    return match[1]
  }
}

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
    const menu = await loadMenu()
    const menuSection = buildMenuSection(menu)
    const bestsellerLine = buildBestsellerLine(menu)
    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n## MENU (internal reference — do not recite)\nItems are annotated with [tags] and ★BESTSELLER markers. Use tags to match customer intent.\n${menuSection}\n\n## BESTSELLERS\n${bestsellerLine}\n\n## CURRENT WEATHER\n${describeWeather(body.weather)}\n\n## CUSTOMER'S CURRENT CART\n${cartLine}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const textBlock = response.content.find(block => block.type === 'text')
    const rawText = textBlock?.text ?? ''

    const cleaned = rawText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()

    const parsed = tryParseChatJson(cleaned) as any
    if (parsed) {
      return Response.json({
        message: parsed.message ?? "Sorry, I didn't catch that. Want to try again?",
        buttons: parsed.buttons ?? FALLBACK_BUTTONS,
        cartActions: parsed.cartActions ?? [],
      })
    }

    const salvagedMessage = extractMessageField(cleaned)
    return Response.json({
      message: salvagedMessage ?? "Sorry, I'm having trouble responding right now. Try one of these?",
      buttons: FALLBACK_BUTTONS,
      cartActions: [],
    })
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
