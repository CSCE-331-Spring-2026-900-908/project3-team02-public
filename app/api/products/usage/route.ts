// src/app/api/products/usage/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
  }

  try {
    
    const query = `
      SELECT
          inv.ItemName AS ingredient,
          inv.units,
          COALESCE(SUM(r.quantity * sli_count.cnt), 0) AS amount_used
      FROM Inventory inv
      LEFT JOIN Recipes r ON inv.ingredientID = r.InventoryID
      LEFT JOIN (
          SELECT sli.ItemID, COUNT(*) AS cnt
          FROM SalesLineItem sli
          JOIN Sales s ON sli.saleID = s.saleID
          WHERE s.saleDate >= $1 AND s.saleDate <= $2
          GROUP BY sli.ItemID
      ) sli_count ON r.ItemID = sli_count.ItemID
      GROUP BY inv.ingredientID, inv.ItemName, inv.units
      HAVING COALESCE(SUM(r.quantity * sli_count.cnt), 0) > 0
      ORDER BY amount_used DESC;
    `;
    
    // We append the full day range to the timestamps
    const { rows } = await pool.query(query, [`${start} 00:00:00`, `${end} 23:59:59`]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Product Usage GET Error:', error);
    return NextResponse.json({ error: 'Failed to calculate product usage' }, { status: 500 });
  }
}