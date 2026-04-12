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

const SYSTEM_PROMPT = `You are a friendly and helpful bubble tea shop ordering assistant. You help customers browse the menu, get recommendations, and add items to their cart.

## MENU
${buildMenuSection()}

## RESPONSE FORMAT
You MUST respond with valid JSON in this exact format and nothing else:
{
  "message": "Your friendly response text here",
  "buttons": [
    {"label": "Button text", "action": "add_item", "itemId": 1},
    {"label": "Button text", "action": "show_category", "category": "Milk Tea"},
    {"label": "Button text", "action": "send_message", "messageText": "What do you recommend?"}
  ],
  "cartActions": []
}

## BUTTON RULES
- Always include 2-4 buttons that are relevant to the conversation
- After listing items in a category, include "Add [item name]" buttons for each item
- Always include at least one navigational button like "See other categories" or "What else do you have?"
- For recommendations, include "Add" buttons for the recommended items

## CART ACTION RULES
- Only include cartActions when the customer explicitly asks to add something
- Each cart action needs: type "add", itemId (number), itemName (string), price (number)
- These must match real items from the MENU above
- After adding, suggest related items or ask if they want anything else

## PERSONALITY
- Be concise (1-2 sentences max per response)
- Be enthusiastic about the drinks
- If asked about ingredients or allergens, be honest that you don't have detailed ingredient info and suggest asking staff
- Do NOT wrap your response in markdown code blocks — return raw JSON only`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  cartSummary?: string
}

const FALLBACK_BUTTONS = [
  { label: 'Browse Milk Tea', action: 'show_category' as const, category: 'Milk Tea' },
  { label: 'Browse Fruit Tea', action: 'show_category' as const, category: 'Fruit Tea' },
  { label: "What's popular?", action: 'send_message' as const, messageText: "What are your most popular drinks?" },
]

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest
    const messages = body.messages ?? []

    if (!messages.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    const systemPrompt = body.cartSummary
      ? `${SYSTEM_PROMPT}\n\n## CUSTOMER'S CURRENT CART\n${body.cartSummary}`
      : `${SYSTEM_PROMPT}\n\n## CUSTOMER'S CURRENT CART\nEmpty - nothing ordered yet`

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
