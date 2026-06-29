'use client';

import { DayConfig, Task } from './types';
import { JS_DAY_TO_ID } from './data';

// ── Date helpers (sync) ────────────────────────────────────────────────────────

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function todayDayId(): string {
  return JS_DAY_TO_ID[new Date().getDay()];
}

export function weekKey(date?: Date): string {
  const d = date ?? new Date();
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ── Days ───────────────────────────────────────────────────────────────────────

export async function getCustomDays(): Promise<DayConfig[]> {
  try {
    const res = await fetch('/api/days');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ── Task CRUD (admin) ──────────────────────────────────────────────────────────

export async function createTaskApi(dayId: string, task: Task): Promise<void> {
  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayId, ...task }),
  });
}

export async function updateTaskApi(task: Task): Promise<void> {
  await fetch(`/api/tasks/${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
}

export async function deleteTaskApi(taskId: string): Promise<void> {
  await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
}

export async function reorderTasksApi(orderedIds: string[]): Promise<void> {
  await fetch('/api/tasks/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
}

export async function updateMissionApi(dayId: string, text: string): Promise<void> {
  await fetch(`/api/days/${dayId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionText: text }),
  });
}

// ── Task Completions ───────────────────────────────────────────────────────────

export async function getDayCompletions(
  date: string,
  dayId: string,
): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(`/api/completions?date=${date}&dayId=${dayId}`);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function setTaskComplete(
  date: string,
  dayId: string,
  taskId: string,
  completed: boolean,
): Promise<void> {
  await fetch('/api/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, dayId, taskId, completed }),
  });
}

// ── Mission Log ────────────────────────────────────────────────────────────────

export async function getThisWeekMissions(): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(`/api/missions?weekKey=${weekKey()}`);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function setMissionComplete(dayId: string, completed: boolean): Promise<void> {
  await fetch('/api/missions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayId, completed, weekKey: weekKey() }),
  });
}

export async function isMissionComplete(dayId: string): Promise<boolean> {
  const missions = await getThisWeekMissions();
  return missions[dayId] ?? false;
}

export async function getWeekMissionCount(): Promise<{ completed: number; total: number }> {
  const missions = await getThisWeekMissions();
  return { completed: Object.values(missions).filter(Boolean).length, total: 7 };
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export interface DailyProgress {
  date: string;
  label: string;
  total: number;
  completed: number;
  percent: number;
}

export async function getLast7DaysProgress(days: DayConfig[]): Promise<DailyProgress[]> {
  try {
    const res = await fetch('/api/completions/week');
    const allCompletions: Record<string, Record<string, Record<string, boolean>>> =
      res.ok ? await res.json() : {};

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayId = JS_DAY_TO_ID[d.getDay()];
      const dayConfig = days.find((day) => day.id === dayId);
      const dayCompletions = allCompletions[dateStr]?.[dayId] ?? {};
      const total = dayConfig?.tasks.length ?? 0;
      const completed = Object.values(dayCompletions).filter(Boolean).length;
      return {
        date: dateStr,
        label: dayConfig?.shortName ?? '—',
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  } catch {
    return [];
  }
}

export async function getTodayProgress(days: DayConfig[]): Promise<DailyProgress> {
  const all = await getLast7DaysProgress(days);
  return (
    all[all.length - 1] ?? {
      date: todayString(),
      label: '—',
      total: 0,
      completed: 0,
      percent: 0,
    }
  );
}

// ── PIN ────────────────────────────────────────────────────────────────────────

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/pin?pin=${encodeURIComponent(pin)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.valid;
  } catch {
    return false;
  }
}

export async function setPin(pin: string): Promise<void> {
  await fetch('/api/pin', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
}
