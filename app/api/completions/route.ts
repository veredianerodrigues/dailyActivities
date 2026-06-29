import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const dayId = searchParams.get('dayId');
  if (!date || !dayId) return NextResponse.json({});

  try {
    const [rows] = await pool.execute(
      `SELECT task_id, completed FROM completions WHERE date = ? AND day_id = ?`,
      [date, dayId],
    ) as [any[], any];

    const result: Record<string, boolean> = {};
    rows.forEach((r: any) => { result[r.task_id] = Boolean(r.completed); });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/completions]', err);
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, dayId, taskId, completed } = await req.json();
    await pool.execute(
      `INSERT INTO completions (date, day_id, task_id, completed) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE completed = ?`,
      [date, dayId, taskId, completed ? 1 : 0, completed ? 1 : 0],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/completions]', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await pool.execute('DELETE FROM completions');
    await pool.execute('DELETE FROM mission_completions');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/completions]', err);
    return NextResponse.json({ error: 'Clear failed' }, { status: 500 });
  }
}
