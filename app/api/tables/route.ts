import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Using a connection string from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for many managed databases (e.g., Supabase, Heroku, AWS RDS)
  },
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    client.release();
    
    const tables = result.rows.map(row => row.table_name);
    
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error querying table names:', error);
    return NextResponse.json({ error: 'Failed to fetch table names' }, { status: 500 });
  }
}
