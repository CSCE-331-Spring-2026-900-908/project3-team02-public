// src/app/api/orders/history/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  try {
    // 1. Fetch Order List 
    let listQuery = `
      SELECT s.saleID, s.saleDate, s.ItemCount, s.total, e.name AS cashier
      FROM Sales s
      LEFT JOIN Employees e ON s.employeeID = e.employeeID
    `;
    
    const queryParams = [];
    if (start && end) {
      listQuery += ` WHERE s.saleDate >= $1 AND s.saleDate <= $2`;
      queryParams.push(start, end);
    }
    listQuery += ` ORDER BY s.saleDate DESC LIMIT 100`;

    const listRes = await pool.query(listQuery, queryParams);

    // 2. Fetch Chart Data 
    const chartQuery = `
      SELECT 
        EXTRACT(MONTH FROM saleDate) as month_num,
        TO_CHAR(saleDate, 'Mon') as month,
        SUM(total) as revenue
      FROM Sales
      WHERE saleDate > NOW() - INTERVAL '12 months'
      GROUP BY month_num, month
      ORDER BY month_num;
    `;
    const chartRes = await pool.query(chartQuery);

    return NextResponse.json({
      orders: listRes.rows,
      chartData: chartRes.rows
    });
  } catch (error) {
    console.error('Orders History GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}