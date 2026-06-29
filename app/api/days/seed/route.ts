import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { DEFAULT_DAYS } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const conn = await pool.getConnection();

    try {
      if (body.reset) {
        await conn.execute('DELETE FROM days');
      }

      for (const day of DEFAULT_DAYS) {
        await conn.execute(
          `INSERT IGNORE INTO days (id, name, short_name, emoji, subtitle, color, light_color, dark_color, mission_icon, mission_text)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [day.id, day.name, day.shortName, day.emoji, day.subtitle,
           day.color, day.lightColor, day.darkColor, day.mission.icon, day.mission.text],
        );

        for (let i = 0; i < day.tasks.length; i++) {
          const task = day.tasks[i];
          await conn.execute(
            `INSERT IGNORE INTO tasks (id, day_id, name, emoji, task_time, note, is_mission, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [task.id, day.id, task.name, task.emoji,
             task.time ?? null, task.note ?? null, task.isMission ? 1 : 0, i],
          );

          if (task.subTasks) {
            for (let j = 0; j < task.subTasks.length; j++) {
              const sub = task.subTasks[j];
              await conn.execute(
                `INSERT IGNORE INTO sub_tasks (id, task_id, name, emoji, order_index) VALUES (?, ?, ?, ?, ?)`,
                [sub.id, task.id, sub.name, sub.emoji, j],
              );
            }
          }
        }
      }

      return NextResponse.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[POST /api/days/seed]', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
