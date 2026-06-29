import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { dayId, id, name, emoji, time, note, isMission } = await req.json();

    const [maxRow] = await pool.execute(
      `SELECT COALESCE(MAX(order_index), -1) as max_order FROM tasks WHERE day_id = ?`,
      [dayId],
    ) as [any[], any];

    const newOrder = (maxRow[0].max_order as number) + 1;

    await pool.execute(
      `INSERT INTO tasks (id, day_id, name, emoji, task_time, note, is_mission, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dayId, name, emoji, time ?? null, note ?? null, isMission ? 1 : 0, newOrder],
    );

    return NextResponse.json({ id, name, emoji, time, note, isMission, order: newOrder });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return NextResponse.json({ error: 'Create failed' }, { status: 500 });
  }
}
