import { NextResponse } from 'next/server';
import {pool} from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    let query = '';
    // Hourly Activity uses SPECIAL QUERY #3 logic
    if (type === 'hourly') {
      query = `
        SELECT 
          EXTRACT(HOUR FROM (saleDate AT TIME ZONE 'UTC' AT TIME ZONE 'CST')) AS hour_of_day, 
          COUNT(*) AS txn_count, 
          ROUND(SUM(total)::numeric, 2) AS total_rev
        FROM Sales 
        WHERE zreport_id IS NULL
        GROUP BY hour_of_day 
        ORDER BY hour_of_day;
      `;
    } 
    // Payment Methods differentiation logic
    else if (type === 'payments') {
      query = `
        SELECT 
          EXTRACT(HOUR FROM (saleDate AT TIME ZONE 'UTC' AT TIME ZONE 'CST')) AS hour_of_day, 
          payment_type, 
          COUNT(*) AS txn_count, 
          SUM(total) AS total_rev
        FROM Sales 
        WHERE zreport_id IS NULL 
        GROUP BY hour_of_day, payment_type 
        ORDER BY hour_of_day;
      `;
    } 
    // Employee Performance uses QUERY #7 logic
    else {
      query = `
        SELECT e.name, COUNT(s.saleID) AS txn_count, SUM(s.total) AS total_rev
        FROM Employees e
        JOIN Sales s ON e.employeeID = s.employeeID
        WHERE s.zreport_id IS NULL
        GROUP BY e.name ORDER BY total_rev DESC;
      `;
    }

    const { rows } = await pool.query(query);
    
    // Formatting logic to combine Payment Type and Time in the same row
    const formattedRows = rows.map(row => {
      let label = "";
      
      if (type === 'payments') {
        const method = row.payment_type === 0 ? 'Cash' : row.payment_type === 1 ? 'Card' : 'Other';
        const hour = Number(row.hour_of_day);
        const timeLabel = hour >= 12 
          ? `${hour === 12 ? 12 : hour - 12}:00 PM` 
          : `${hour === 0 ? 12 : hour}:00 AM`;
        label = `${method} — ${timeLabel}`;
      } else if (type === 'hourly') {
        const hour = Number(row.hour_of_day);
        label = hour >= 12 
          ? `${hour === 12 ? 12 : hour - 12}:00 PM` 
          : `${hour === 0 ? 12 : hour}:00 AM`;
      } else {
        label = row.name || `Employee #${row.employeeid}`;
      }

      return {
        label,
        value: row.total_rev,
        count: row.txn_count
      };
    });

    return NextResponse.json(formattedRows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const { employeeSignature } = await request.json();
    await client.query('BEGIN');

    // 1. Prevent multiple Z-Reports per day
    const checkRes = await client.query('SELECT COUNT(*) FROM z_reports WHERE report_date = CURRENT_DATE');
    if (parseInt(checkRes.rows[0].count) > 0) throw new Error('A Z-Report has already been generated for today.');

    // 2. Aggregate unprocessed sales data
    const aggQuery = `
      SELECT 
        COUNT(*) AS tx_count, 
        SUM(subtotal) AS sales, 
        SUM(tax) AS tax,
        SUM(CASE WHEN payment_type = 0 THEN total ELSE 0 END) AS cash,
        SUM(CASE WHEN payment_type = 1 THEN total ELSE 0 END) AS card
      FROM Sales WHERE zreport_id IS NULL;
    `;
    const aggRes = await client.query(aggQuery);
    const data = aggRes.rows[0];

    if (parseInt(data.tx_count) === 0) throw new Error('No pending transactions found to finalize.');

    // 3. Create Z-Report and stamp the finalized sales
    const insertSql = `
      INSERT INTO z_reports (report_date, total_sales, total_tax, cash_collected, card_collected, employee_signature)
      VALUES (CURRENT_DATE, $1, $2, $3, $4, $5) RETURNING report_id;
    `;
    const reportRes = await client.query(insertSql, [data.sales, data.tax, data.cash, data.card, employeeSignature]);
    const reportId = reportRes.rows[0].report_id;

    await client.query('UPDATE Sales SET zreport_id = $1 WHERE zreport_id IS NULL', [reportId]);

    await client.query('COMMIT');
    return NextResponse.json({ success: true, reportId, summary: data });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}