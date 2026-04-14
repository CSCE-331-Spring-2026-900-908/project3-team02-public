// src/app/api/inventory/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    
    const query = `
      SELECT
          inv.ingredientID,
          inv.ItemName AS ingredient,
          inv.units,
          inv.quantity AS current_stock,
          COALESCE(SUM(r.quantity * sli_count.cnt), 0) AS estimated_used
      FROM Inventory inv
      LEFT JOIN Recipes r ON inv.ingredientID = r.InventoryID
      LEFT JOIN (
          SELECT ItemID, COUNT(*) AS cnt
          FROM SalesLineItem
          GROUP BY ItemID
      ) sli_count ON r.ItemID = sli_count.ItemID
      GROUP BY inv.ingredientID, inv.ItemName, inv.units, inv.quantity
      ORDER BY estimated_used DESC;
    `;
    const { rows } = await pool.query(query);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Inventory GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { itemName, quantity, units = 'units' } = await request.json();
    
    // Check for duplicates
    const checkRes = await pool.query('SELECT COUNT(*) FROM inventory WHERE itemname = $1', [itemName]);
    if (parseInt(checkRes.rows[0].count) > 0) {
      return NextResponse.json({ error: 'Item already exists' }, { status: 400 });
    }

    // Insert new item (Assuming ingredientID is a SERIAL primary key in your actual DB)
    const getNextId = await pool.query('SELECT COALESCE(MAX(ingredientID), 0) + 1 AS next_id FROM inventory');
    const nextId = getNextId.rows[0].next_id;

    await pool.query(
      'INSERT INTO inventory (ingredientID, itemname, quantity, units) VALUES ($1, $2, $3, $4)',
      [nextId, itemName, quantity, units]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory POST Error:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { ingredientId, itemName, quantity } = await request.json();
    
    await pool.query(
      'UPDATE inventory SET itemname = $1, quantity = $2 WHERE ingredientid = $3',
      [itemName, quantity, ingredientId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}