import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, emoji, time, note, isMission } = await req.json();
    await pool.execute(
      `UPDATE tasks SET name = ?, emoji = ?, task_time = ?, note = ?, is_mission = ? WHERE id = ?`,
      [name, emoji, time ?? null, note ?? null, isMission ? 1 : 0, params.id],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/tasks/[id]]', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.execute(`DELETE FROM tasks WHERE id = ?`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tasks/[id]]', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
