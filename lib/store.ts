'use client';

import { CompletionLog, DayConfig, MissionLog } from './types';
import { DEFAULT_DAYS, JS_DAY_TO_ID } from './data';

// ─── Keys ───────────────────────────────────────────────────────────────────
const COMPLETIONS_KEY = 'marcus_completions';
const MISSIONS_KEY = 'marcus_missions';
const CUSTOM_DAYS_KEY = 'marcus_custom_days';
const PIN_KEY = 'marcus_pin';
const DEFAULT_PIN = '1234';

// ─── Date helpers ────────────────────────────────────────────────────────────
export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function todayDayId(): string {
  return JS_DAY_TO_ID[new Date().getDay()];
}

/** Returns "YYYY-WNN" (ISO week key) for mission grouping */
export function weekKey(date?: Date): string {
  const d = date ?? new Date();
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─── Task Completions ─────────────────────────────────────────────────────────
export function getCompletions(): CompletionLog {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(COMPLETIONS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function setTaskComplete(
  date: string,
  dayId: string,
  taskId: string,
  completed: boolean,
): void {
  const log = getCompletions();
  if (!log[date]) log[date] = {};
  if (!log[date][dayId]) log[date][dayId] = {};
  log[date][dayId][taskId] = completed;
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(log));
}

export function isTaskComplete(date: string, dayId: string, taskId: string): boolean {
  return getCompletions()[date]?.[dayId]?.[taskId] ?? false;
}

export function getDayCompletions(date: string, dayId: string): Record<string, boolean> {
  return getCompletions()[date]?.[dayId] ?? {};
}

// ─── Mission Log ──────────────────────────────────────────────────────────────
export function getMissionLog(): MissionLog {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(MISSIONS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function setMissionComplete(dayId: string, completed: boolean): void {
  const log = getMissionLog();
  const key = weekKey();
  if (!log[key]) log[key] = {};
  log[key][dayId] = completed;
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(log));
}

export function isMissionComplete(dayId: string): boolean {
  return getMissionLog()[weekKey()]?.[dayId] ?? false;
}

export function getThisWeekMissions(): Record<string, boolean> {
  return getMissionLog()[weekKey()] ?? {};
}

// ─── Custom Days (admin edits) ────────────────────────────────────────────────
export function getCustomDays(): DayConfig[] {
  if (typeof window === 'undefined') return DEFAULT_DAYS;
  try {
    const raw = localStorage.getItem(CUSTOM_DAYS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_DAYS;
  } catch {
    return DEFAULT_DAYS;
  }
}

export function saveCustomDays(days: DayConfig[]): void {
  localStorage.setItem(CUSTOM_DAYS_KEY, JSON.stringify(days));
}

export function resetToDefaults(): void {
  localStorage.removeItem(CUSTOM_DAYS_KEY);
}

// ─── PIN ──────────────────────────────────────────────────────────────────────
export function getPin(): string {
  return typeof window !== 'undefined'
    ? (localStorage.getItem(PIN_KEY) ?? DEFAULT_PIN)
    : DEFAULT_PIN;
}

export function setPin(pin: string): void {
  localStorage.setItem(PIN_KEY, pin);
}

export function verifyPin(pin: string): boolean {
  return pin === getPin();
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DailyProgress {
  date: string;
  label: string; // "Seg", "Ter", etc.
  total: number;
  completed: number;
  percent: number;
}

export function getLast7DaysProgress(days: DayConfig[]): DailyProgress[] {
  const completions = getCompletions();
  const result: DailyProgress[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayId = JS_DAY_TO_ID[d.getDay()];
    const dayConfig = days.find((day) => day.id === dayId);
    const dayCompletions = completions[dateStr]?.[dayId] ?? {};
    const total = dayConfig?.tasks.length ?? 0;
    const completed = Object.values(dayCompletions).filter(Boolean).length;

    result.push({
      date: dateStr,
      label: dayConfig?.shortName ?? '—',
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }

  return result;
}

export function getTodayProgress(days: DayConfig[]): DailyProgress {
  const all = getLast7DaysProgress(days);
  return all[all.length - 1];
}

export function getWeekMissionCount(): { completed: number; total: number } {
  const missions = getThisWeekMissions();
  const completed = Object.values(missions).filter(Boolean).length;
  return { completed, total: 7 };
}

export function clearAllData(): void {
  localStorage.removeItem(COMPLETIONS_KEY);
  localStorage.removeItem(MISSIONS_KEY);
}
