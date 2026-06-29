'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  todayDayId,
  todayString,
  getCustomDays,
  getDayCompletions,
  getThisWeekMissions,
} from '@/lib/store';
import { DayConfig } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

export default function HomePage() {
  const [todayId, setTodayId] = useState('');
  const [todayDay, setTodayDay] = useState<DayConfig | null>(null);
  const [days, setDays] = useState<DayConfig[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const [missions, setMissions] = useState({ completed: 0, total: 7 });

  useEffect(() => {
    (async () => {
      const id = todayDayId();
      setTodayId(id);
      const [loadedDays, completions, weekMissions] = await Promise.all([
        getCustomDays(),
        getDayCompletions(todayString(), id),
        getThisWeekMissions(),
      ]);
      setDays(loadedDays);
      const day = loadedDays.find((d) => d.id === id) ?? null;
      setTodayDay(day);
      const total = day?.tasks.length ?? 0;
      const completed = Object.values(completions).filter(Boolean).length;
      setProgress({ completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 });
      setMissions({ completed: Object.values(weekMissions).filter(Boolean).length, total: 7 });
    })();
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Hero header */}
      <div
        className="relative overflow-hidden px-6 pt-12 pb-8"
        style={{ background: todayDay?.color ?? '#3B82F6' }}
      >
        <div
          className="absolute rounded-full opacity-10"
          style={{ width: 160, height: 160, background: 'white', top: -50, right: -30 }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{ width: 90, height: 90, background: 'white', bottom: -30, left: '35%' }}
        />

        <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">Olá, Marcus! 👋</p>
        <h1 className="text-white text-3xl font-black leading-tight">
          {todayDay?.name ?? 'Carregando...'}
        </h1>
        <p className="text-white/80 text-sm font-semibold mt-1">{todayDay?.subtitle}</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="text-white font-black text-sm whitespace-nowrap">
            {progress.completed}/{progress.total} tarefas
          </span>
        </div>
      </div>

      {/* Main actions */}
      <div className="flex-1 px-5 pt-5 flex flex-col gap-3">
        <Link
          href={`/rotina/${todayId}`}
          className="flex items-center gap-4 rounded-2xl p-4 text-white font-black text-lg shadow-lg active:scale-95 transition-transform"
          style={{ background: todayDay?.color ?? '#3B82F6' }}
        >
          <span className="text-3xl">{todayDay?.emoji ?? '📋'}</span>
          <div>
            <div>Ver rotina de hoje</div>
            <div className="text-sm font-semibold opacity-80">{todayDay?.name}</div>
          </div>
          <span className="ml-auto text-2xl">→</span>
        </Link>

        <Link
          href="/missoes"
          className="flex items-center gap-4 rounded-2xl p-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-lg shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-3xl">🏆</span>
          <div>
            <div>Missões da Semana</div>
            <div className="text-sm font-semibold opacity-90">
              {missions.completed} de {missions.total} concluídas
            </div>
          </div>
          <span className="ml-auto text-2xl">→</span>
        </Link>

        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest px-1 mb-2">
            Outros dias
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((id) => {
              const day = days.find((d) => d.id === id);
              const isToday = id === todayId;
              return (
                <Link
                  key={id}
                  href={`/rotina/${id}`}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-center active:scale-95 transition-transform"
                  style={{
                    background: isToday ? day?.color : day?.lightColor,
                    border: isToday ? `2px solid ${day?.color}` : '2px solid transparent',
                  }}
                >
                  <span className="text-lg">{day?.emoji}</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isToday ? 'white' : day?.darkColor }}
                  >
                    {day?.shortName}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-2xl p-4 bg-gray-50 border border-gray-100 active:bg-gray-100 transition-colors"
        >
          <span className="text-2xl">📊</span>
          <div>
            <div className="font-black text-gray-800">Dashboard</div>
            <div className="text-sm text-gray-400 font-semibold">Ver progresso da semana</div>
          </div>
          <span className="ml-auto text-gray-300 text-xl">→</span>
        </Link>
      </div>

      <Link
        href="/admin"
        className="fixed bottom-24 right-5 w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center shadow-lg active:scale-90 transition-transform z-50"
        title="Admin"
      >
        <span className="text-xl">⚙️</span>
      </Link>

      <BottomNav active="home" />
    </div>
  );
}
