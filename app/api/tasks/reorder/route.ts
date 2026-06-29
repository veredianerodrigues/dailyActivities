import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const { orderedIds }: { orderedIds: string[] } = await req.json();
    const conn = await pool.getConnection();
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await conn.execute(`UPDATE tasks SET order_index = ? WHERE id = ?`, [i, orderedIds[i]]);
      }
      return NextResponse.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[PUT /api/tasks/reorder]', err);
    return NextResponse.json({ error: 'Reorder failed' }, { status: 500 });
  }
}
