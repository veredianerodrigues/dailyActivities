'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCustomDays,
  getDayCompletions,
  setTaskComplete,
  setMissionComplete,
  isMissionComplete,
  todayString,
} from '@/lib/store';
import { DayConfig, Task } from '@/lib/types';
import { DAY_ORDER } from '@/lib/data';
import BottomNav from '@/components/BottomNav';

export default function RotinaPage() {
  const { dia } = useParams<{ dia: string }>();
  const router = useRouter();
  const [day, setDay] = useState<DayConfig | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [missionDone, setMissionDone] = useState(false);
  const today = todayString();

  useEffect(() => {
    (async () => {
      const loaded = await getCustomDays();
      const found = loaded.find((d) => d.id === dia);
      if (!found) { router.replace('/'); return; }
      setDay(found);
      const [completions, missionStatus] = await Promise.all([
        getDayCompletions(today, dia),
        isMissionComplete(dia),
      ]);
      setChecked(completions);
      setMissionDone(missionStatus);
    })();
  }, [dia, today, router]);

  const toggle = useCallback(
    (taskId: string) => {
      const next = !checked[taskId];
      setChecked((prev) => ({ ...prev, [taskId]: next }));
      setTaskComplete(today, dia, taskId, next);
    },
    [checked, today, dia],
  );

  const toggleMission = useCallback(() => {
    const next = !missionDone;
    setMissionDone(next);
    setMissionComplete(dia, next);
  }, [missionDone, dia]);

  if (!day) return null;

  const total = day.tasks.length;
  const completed = Object.values(checked).filter(Boolean).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const currentIndex = DAY_ORDER.indexOf(dia);
  const prevDay = currentIndex > 0 ? DAY_ORDER[currentIndex - 1] : null;
  const nextDay = currentIndex < DAY_ORDER.length - 1 ? DAY_ORDER[currentIndex + 1] : null;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div
        className="relative overflow-hidden px-5 pt-10 pb-5 flex-shrink-0"
        style={{ background: day.color }}
      >
        <div className="absolute rounded-full bg-white/10 w-28 h-28 -top-8 right-4" />
        <div className="absolute rounded-full bg-white/8 w-16 h-16 -bottom-6 left-1/3" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          {prevDay ? (
            <Link href={`/rotina/${prevDay}`} className="text-white/70 text-2xl font-black px-1">←</Link>
          ) : <div className="w-8" />}
          <Link href="/" className="text-white/70 text-sm font-bold">✕ fechar</Link>
          {nextDay ? (
            <Link href={`/rotina/${nextDay}`} className="text-white/70 text-2xl font-black px-1">→</Link>
          ) : <div className="w-8" />}
        </div>

        <div className="text-5xl mb-1 relative z-10">{day.emoji}</div>
        <h1 className="text-white text-3xl font-black relative z-10">{day.name}</h1>
        <p className="text-white/80 text-sm font-semibold mt-1 relative z-10">{day.subtitle}</p>

        <div className="mt-3 flex items-center gap-3 relative z-10">
          <div className="flex-1 bg-white/25 rounded-full h-2.5">
            <div
              className="bg-white rounded-full h-2.5 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-white font-black text-xs">{completed}/{total}</span>
        </div>
      </div>

      {/* Mission Badge */}
      <div className="px-4 pt-3 flex-shrink-0">
        <button
          onClick={toggleMission}
          className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-95"
          style={{
            background: missionDone
              ? 'linear-gradient(135deg, #4ade80, #22c55e)'
              : 'linear-gradient(135deg, #FBBF24, #F97316)',
            boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
          }}
        >
          <span className="text-2xl">{missionDone ? '✅' : day.mission.icon}</span>
          <div className="flex-1">
            <div className="text-[9px] font-black text-white/70 tracking-widest uppercase">
              {missionDone ? 'Missão concluída! 🎉' : 'Missão do Dia'}
            </div>
            <div className="text-sm font-black text-white leading-tight">{day.mission.text}</div>
          </div>
          <div
            className="w-7 h-7 rounded-lg border-2 border-white/60 flex items-center justify-center text-white font-black text-sm"
            style={{ background: missionDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}
          >
            {missionDone ? '✓' : ''}
          </div>
        </button>
      </div>

      {/* Tasks */}
      <div
        className="flex-1 px-4 pt-3 pb-3 overflow-y-auto no-scrollbar"
        style={{ background: day.lightColor }}
      >
        <div className="flex flex-col gap-2">
          {day.tasks.map((task: Task) => (
            <div key={task.id}>
              <TaskRow
                task={task}
                checked={!!checked[task.id]}
                dayColor={day.color}
                onToggle={() => toggle(task.id)}
              />
              {task.subTasks && (
                <div className="ml-12 mt-1 flex flex-col gap-1">
                  {task.subTasks.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => toggle(sub.id)}
                      className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 text-left active:bg-white/90 transition-colors"
                    >
                      <div
                        className="w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center text-[10px] font-black text-white"
                        style={{
                          borderColor: checked[sub.id] ? '#10B981' : '#D1D5DB',
                          background: checked[sub.id] ? '#10B981' : 'transparent',
                        }}
                      >
                        {checked[sub.id] ? '✓' : ''}
                      </div>
                      <span className="text-sm">{sub.emoji}</span>
                      <span className="text-xs font-semibold text-gray-600">{sub.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="rotina" />
    </div>
  );
}

function TaskRow({
  task,
  checked,
  dayColor,
  onToggle,
}: {
  task: Task;
  checked: boolean;
  dayColor: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left active:scale-95 transition-all"
      style={{
        background: task.isMission ? '#FFF7ED' : 'white',
        borderLeft: `4px solid ${task.isMission ? '#F97316' : dayColor}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        opacity: checked ? 0.65 : 1,
      }}
    >
      <div
        className="w-6 h-6 rounded-lg flex-shrink-0 border-2 flex items-center justify-center text-xs font-black text-white transition-all"
        style={{
          borderColor: checked ? '#10B981' : task.isMission ? '#F97316' : dayColor,
          background: checked ? '#10B981' : 'transparent',
        }}
      >
        {checked ? '✓' : ''}
      </div>
      <span className="text-lg flex-shrink-0 w-6 text-center">{task.emoji}</span>
      <div className="flex-1 min-w-0">
        {task.time && (
          <div
            className="text-[9px] font-black tracking-widest uppercase"
            style={{ color: task.isMission ? '#EA580C' : dayColor }}
          >
            {task.time}{task.isMission ? ' · ⭐ missão' : ''}
          </div>
        )}
        <div
          className="text-sm font-bold leading-tight"
          style={{ textDecoration: checked ? 'line-through' : 'none', color: checked ? '#9CA3AF' : '#1F2937' }}
        >
          {task.name}
        </div>
        {task.note && (
          <div className="text-[11px] text-gray-400 font-semibold mt-0.5">{task.note}</div>
        )}
      </div>
    </button>
  );
}
