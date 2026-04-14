// src/app/api/employees/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    
    const query = `
      SELECT 
          e.employeeid, 
          e.name, 
          e.email, 
          e.role, 
          COUNT(s.saleID) AS orders_processed, 
          COALESCE(ROUND(SUM(s.total)::numeric, 2), 0) AS total_sales
      FROM employees e
      LEFT JOIN sales s ON e.employeeid = s.employeeid
      GROUP BY e.employeeid, e.name, e.email, e.role
      ORDER BY e.name;
    `;
    const { rows } = await pool.query(query);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Employees GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, role } = await request.json();
    
    // Check if email already exists
    const checkRes = await pool.query('SELECT COUNT(*) FROM employees WHERE email = $1', [email]);
    if (parseInt(checkRes.rows[0].count) > 0) {
      return NextResponse.json({ error: 'An employee with this email already exists' }, { status: 400 });
    }

    // Generate a 5-digit ID (Mimicking your Java Random().nextInt(90000) + 10000 logic)
    const newId = Math.floor(10000 + Math.random() * 90000);

    await pool.query(
      'INSERT INTO employees (employeeid, name, email, role, sales) VALUES ($1, $2, $3, $4, 0)',
      [newId, name, email, role]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employees POST Error:', error);
    return NextResponse.json({ error: 'Failed to add employee' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { employeeId, name, email, role } = await request.json();
    
    await pool.query(
      'UPDATE employees SET name = $1, email = $2, role = $3 WHERE employeeid = $4',
      [name, email, role, employeeId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employees PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    // Note: If an employee has historical sales, you usually shouldn't delete them, 
    // or you'll break the foreign keys in the Sales table. 
    // You might want to implement a 'soft delete' (isActive = false) later!
    await pool.query('DELETE FROM employees WHERE employeeid = $1', [employeeId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employees DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete employee (They likely have existing sales records)' }, { status: 500 });
  }
}