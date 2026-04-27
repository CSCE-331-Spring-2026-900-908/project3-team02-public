// src/app/api/menu/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {

    const query = `
      SELECT 
        i.itemid, 
        i.itemname, 
        i.category, 
        i.price,
        COALESCE(
          json_agg(
            json_build_object('id', inv.ingredientid, 'name', inv.itemname)
          ) FILTER (WHERE inv.ingredientid IS NOT NULL), 
          '[]'
        ) AS ingredients
      FROM items i
      LEFT JOIN recipes r ON i.itemid = r.itemid
      LEFT JOIN inventory inv ON r.inventoryid = inv.ingredientid
      GROUP BY i.itemid, i.itemname, i.category, i.price
      ORDER BY i.itemname;
    `;
    const { rows } = await pool.query(query);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Menu GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const { itemName, category, price, ingredientIds } = await request.json();
    
    await client.query('BEGIN');

    // 1. Get next Item ID
    const itemRes = await client.query('SELECT COALESCE(MAX(itemid), 0) + 1 AS next_id FROM items');
    const newItemId = itemRes.rows[0].next_id;

    // 2. Insert the Item
    await client.query(
      'INSERT INTO items (itemid, itemname, price, category, isactive) VALUES ($1, $2, $3, $4, true)',
      [newItemId, itemName, price, category]
    );

    // 3. Insert the Recipes (Ingredients)
    if (ingredientIds && ingredientIds.length > 0) {
      const recipeRes = await client.query('SELECT COALESCE(MAX(recipeid), 0) FROM recipes');
      let nextRecipeId = parseInt(recipeRes.rows[0].coalesce) + 1;

      for (const invId of ingredientIds) {
        await client.query(
          'INSERT INTO recipes (recipeid, itemid, inventoryid, quantity) VALUES ($1, $2, $3, 1)',
          [nextRecipeId++, newItemId, invId]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Menu POST Error:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request) {
  const client = await pool.connect();
  try {
    const { itemId, itemName, category, price, ingredientIds } = await request.json();
    
    await client.query('BEGIN');

    // 1. Update the Item
    await client.query(
      'UPDATE items SET itemname = $1, category = $2, price = $3 WHERE itemid = $4',
      [itemName, category, price, itemId]
    );

    // 2. Clear old recipes
    await client.query('DELETE FROM recipes WHERE itemid = $1', [itemId]);

    // 3. Insert new recipes
    if (ingredientIds && ingredientIds.length > 0) {
      const recipeRes = await client.query('SELECT COALESCE(MAX(recipeid), 0) FROM recipes');
      let nextRecipeId = parseInt(recipeRes.rows[0].coalesce) + 1;

      for (const invId of ingredientIds) {
        await client.query(
          'INSERT INTO recipes (recipeid, itemid, inventoryid, quantity) VALUES ($1, $2, $3, 1)',
          [nextRecipeId++, itemId, invId]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Menu PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const client = await pool.connect();
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    await client.query('BEGIN');
    // Must delete recipes first due to Foreign Key constraints
    await client.query('DELETE FROM recipes WHERE itemid = $1', [itemId]);
    await client.query('DELETE FROM items WHERE itemid = $1', [itemId]);
    await client.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Menu DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  } finally {
    client.release();
  }
}