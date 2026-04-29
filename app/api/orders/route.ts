import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { addToQueue } from '@/lib/queue'

type IncomingOrderItem = {
  itemId: number
  itemName: string
  price: number
  qty: number
  customizations?: string
}

type Body = {
  items: IncomingOrderItem[]
  paymentTypeId: number
  employeeId?: number
}

const TAX_RATE = Number(process.env.TAX_RATE ?? 0.0825)
const DEFAULT_EMPLOYEE_ID = Number(process.env.KIOSK_EMPLOYEE_ID ?? 1)

function parseSweetnessLevel(customizations?: string): number {
  if (!customizations) return 100
  const match = customizations.match(/(\d+)%\s*Sugar/i)
  return match ? Number(match[1]) : 100
}

export async function POST(req: Request) {
  const client = await pool.connect()

  try {
    const body = (await req.json()) as Body
    const items = body.items ?? []
    const paymentTypeId = body.paymentTypeId
    const employeeId = body.employeeId ?? DEFAULT_EMPLOYEE_ID
    
    console.log('=== ORDER RECEIVED ===')
    console.log('Raw body:', JSON.stringify(body, null, 2))
    console.log('Items:', JSON.stringify(items, null, 2))
    
    if (!items.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    const tax = subtotal * TAX_RATE
    const total = subtotal + tax
    const itemCount = items.reduce((c, i) => c + i.qty, 0)

    await client.query('BEGIN')

    const saleInsert = await client.query(
      `INSERT INTO sales (saledate, itemcount, subtotal, tax, total, payment_type, employeeid)
       VALUES (NOW(), $1, $2, $3, $4, $5, $6)
       RETURNING saleid`,
      [itemCount, subtotal, tax, total, paymentTypeId, employeeId]
    )

    const saleId: number = saleInsert.rows[0].saleid

    for (const item of items) {
      const lineSubtotal = item.price * item.qty
      const sweetnessLevel = parseSweetnessLevel(item.customizations)

      // Decrement inventory for base item recipe
      await client.query(
        `UPDATE inventory i
         SET quantity = i.quantity - (r.quantity * $2)
         FROM recipes r
         WHERE r.inventoryid = i.ingredientid
           AND r.itemid = $1`,
        [item.itemId, item.qty]
      )

      // Decrement inventory for customization recipes
      if (item.customizations) {
        try {
          // Split customizations and clean them
          const customizationNames = item.customizations
            .split(', ')
            .map(c => c.trim())
            .filter(c => c.length > 0)

          console.log('Processing customizations:', customizationNames, 'for qty:', item.qty)

          if (customizationNames.length > 0) {
            // Get customization IDs that match the names
            const customResult = await client.query(
              `SELECT customizationid FROM customizations 
               WHERE LOWER(TRIM(name)) = ANY(SELECT LOWER(TRIM(unnest($1::text[]))))`,
              [customizationNames]
            )

            const customizationIds = customResult.rows.map(r => r.customizationid)
            console.log('Found customization IDs:', customizationIds)

            if (customizationIds.length > 0) {
              // Decrement inventory based on customization_recipes
              const updateResult = await client.query(
                `UPDATE inventory i
                 SET quantity = i.quantity - (cr.quantity * $2)
                 FROM customization_recipes cr
                 WHERE cr.ingredientid = i.ingredientid
                   AND cr.customizationid = ANY($1)`,
                [customizationIds, item.qty]
              )
              console.log('Updated customization inventory rows:', updateResult.rowCount)
            }
          }
        } catch (customError) {
          console.error('Error updating customization inventory:', customError)
          throw customError
        }
      }

      // Insert saleslineitem
      await client.query(
        `INSERT INTO saleslineitem (saleid, itemid, sweetnesslevel, customization, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.itemId, sweetnessLevel, item.customizations ?? 'no customization', lineSubtotal]
      )
    }

    await client.query(
      `UPDATE employees
       SET sales = sales + 1
       WHERE employeeid = $1`,
      [employeeId]
    )

    await client.query('COMMIT')

    // Fetch item categories for queue time calculation
    const itemIds = items.map(i => i.itemId)
    const catResult = await client.query<{ itemid: number; category: string }>(
      `SELECT itemid, category FROM items WHERE itemid = ANY($1)`,
      [itemIds]
    )
    const categoryMap = new Map(catResult.rows.map(r => [r.itemid, r.category]))

    const queueEntry = addToQueue(
      saleId,
      items.map(i => ({
        itemName: i.itemName,
        qty: i.qty,
        category: categoryMap.get(i.itemId) ?? 'Milk Tea',
        customizations: i.customizations,
      }))
    )

    return NextResponse.json(
      { saleId, subtotal, tax, total, queueMinutes: queueEntry.minutesTotal },
      { status: 201 }
    )
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Checkout error:', error) // Keep it in the server logs
    return NextResponse.json(
      { error: 'Failed to complete order.' }, 
      { status: 500 }
    )
  } finally {
    client.release()
  }
}