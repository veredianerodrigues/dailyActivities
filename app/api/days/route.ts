import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { DayConfig, Task } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [daysRows] = await pool.execute(
      `SELECT id, name, short_name, emoji, subtitle, color, light_color, dark_color, mission_icon, mission_text
       FROM days
       ORDER BY FIELD(id,'segunda','terca','quarta','quinta','sexta','sabado','domingo')`,
    ) as [any[], any];

    const [tasksRows] = await pool.execute(
      `SELECT id, day_id, name, emoji, task_time, note, is_mission, order_index
       FROM tasks ORDER BY order_index ASC`,
    ) as [any[], any];

    const [subRows] = await pool.execute(
      `SELECT id, task_id, name, emoji FROM sub_tasks ORDER BY order_index ASC`,
    ) as [any[], any];

    const days: DayConfig[] = daysRows.map((row: any) => ({
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      emoji: row.emoji,
      subtitle: row.subtitle,
      color: row.color,
      lightColor: row.light_color,
      darkColor: row.dark_color,
      mission: { icon: row.mission_icon, text: row.mission_text },
      tasks: tasksRows
        .filter((t: any) => t.day_id === row.id)
        .map((t: any): Task => ({
          id: t.id,
          name: t.name,
          emoji: t.emoji,
          time: t.task_time ?? undefined,
          note: t.note ?? undefined,
          isMission: Boolean(t.is_mission),
          order: t.order_index,
          subTasks: subRows
            .filter((s: any) => s.task_id === t.id)
            .map((s: any) => ({ id: s.id, name: s.name, emoji: s.emoji })),
        })),
    }));

    return NextResponse.json(days);
  } catch (err) {
    console.error('[GET /api/days]', err);
    return NextResponse.json([], { status: 500 });
  }
}
