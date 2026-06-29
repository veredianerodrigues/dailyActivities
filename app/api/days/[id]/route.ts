import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { missionText } = await req.json();
    await pool.execute(`UPDATE days SET mission_text = ? WHERE id = ?`, [missionText, params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/days/[id]]', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
