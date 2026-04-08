import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

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

      await client.query(
        `INSERT INTO saleslineitem (saleid, itemid, sweetnesslevel, customization, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.itemId, sweetnessLevel, item.customizations ?? '', lineSubtotal]
      )

      // Decrement inventory based on recipe * quantity
      await client.query(
        `UPDATE inventory i
         SET quantity = i.quantity - (r.quantity * $2)
         FROM recipes r
         WHERE r.inventoryid = i.ingredientid
           AND r.itemid = $1`,
        [item.itemId, item.qty]
      )
    }

    await client.query(
      `UPDATE employees
       SET sales = sales + 1
       WHERE employeeid = $1`,
      [employeeId]
    )

    await client.query('COMMIT')
    return NextResponse.json({ saleId, subtotal, tax, total }, { status: 201 })
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