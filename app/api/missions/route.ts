import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekKey = searchParams.get('weekKey');
  if (!weekKey) return NextResponse.json({});

  try {
    const [rows] = await pool.execute(
      `SELECT day_id, completed FROM mission_completions WHERE week_key = ?`,
      [weekKey],
    ) as [any[], any];

    const result: Record<string, boolean> = {};
    rows.forEach((r: any) => { result[r.day_id] = Boolean(r.completed); });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/missions]', err);
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const { dayId, completed, weekKey } = await req.json();
    await pool.execute(
      `INSERT INTO mission_completions (week_key, day_id, completed) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE completed = ?`,
      [weekKey, dayId, completed ? 1 : 0, completed ? 1 : 0],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/missions]', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
