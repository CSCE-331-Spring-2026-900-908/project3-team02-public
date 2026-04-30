import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        SELECT
          customizationid,
          name,
          category,
          price,
          ingredients,
          isactive
        FROM customizations
        WHERE isactive = true
        ORDER BY category, customizationid
      `)

      return NextResponse.json(result.rows)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Customizations GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, category, price, ingredients, isactive = true } = await request.json()

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      const getNextId = await client.query(
        'SELECT COALESCE(MAX(customizationid), 0) + 1 AS next_id FROM customizations'
      )
      const nextId = getNextId.rows[0].next_id

      await client.query(
        `INSERT INTO customizations (customizationid, name, category, price, ingredients, isactive)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nextId, name, category, price || 0.00, ingredients || null, isactive]
      )

      return NextResponse.json({ success: true, customizationid: nextId })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Customizations POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to add customization' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { customizationid, name, category, price, ingredients, isactive } = await request.json()

    if (!customizationid) {
      return NextResponse.json(
        { error: 'Customization ID is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      await client.query(
        `UPDATE customizations
         SET name = $1, category = $2, price = $3, ingredients = $4, isactive = $5
         WHERE customizationid = $6`,
        [name, category, price, ingredients, isactive, customizationid]
      )

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Customizations PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update customization' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { customizationid } = await request.json()

    if (!customizationid) {
      return NextResponse.json(
        { error: 'Customization ID is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      await client.query(
        `UPDATE customizations SET isactive = false WHERE customizationid = $1`,
        [customizationid]
      )

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Customizations DELETE Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete customization' },
      { status: 500 }
    )
  }
}