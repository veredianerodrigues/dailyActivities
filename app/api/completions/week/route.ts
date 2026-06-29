import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];

    const [rows] = await pool.execute(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, day_id, task_id, completed
       FROM completions WHERE date >= ?`,
      [fromDate],
    ) as [any[], any];

    const result: Record<string, Record<string, Record<string, boolean>>> = {};
    rows.forEach((r: any) => {
      if (!result[r.date]) result[r.date] = {};
      if (!result[r.date][r.day_id]) result[r.date][r.day_id] = {};
      result[r.date][r.day_id][r.task_id] = Boolean(r.completed);
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/completions/week]', err);
    return NextResponse.json({});
  }
}
