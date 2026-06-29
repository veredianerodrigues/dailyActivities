import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get('pin');

  try {
    const [rows] = await pool.execute(
      `SELECT value FROM settings WHERE key_name = 'pin'`,
    ) as [any[], any];
    const storedPin = rows[0]?.value ?? '1234';
    return NextResponse.json({ valid: pin === storedPin });
  } catch (err) {
    console.error('[GET /api/pin]', err);
    return NextResponse.json({ valid: false });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { pin } = await req.json();
    await pool.execute(
      `INSERT INTO settings (key_name, value) VALUES ('pin', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [pin, pin],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/pin]', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
