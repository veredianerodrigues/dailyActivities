'use client';

import { useEffect, useState } from 'react';
import {
  getCustomDays,
  getThisWeekMissions,
  setMissionComplete,
} from '@/lib/store';
import { DayConfig } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

export default function MissoesPage() {
  const [days, setDays] = useState<DayConfig[]>([]);
  const [missions, setMissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDays(getCustomDays());
    setMissions(getThisWeekMissions());
  }, []);

  const toggle = (dayId: string) => {
    const next = !missions[dayId];
    setMissions((prev) => ({ ...prev, [dayId]: next }));
    setMissionComplete(dayId, next);
  };

  const completedCount = Object.values(missions).filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-10 pb-6 bg-gray-900">
        <div className="absolute rounded-full border border-yellow-400/20 w-40 h-40 -top-12 right-10" />
        <div className="absolute rounded-full border border-yellow-400/10 w-24 h-24 bottom-0 left-1/4" />
        <div className="relative z-10">
          <p className="text-yellow-400/70 text-xs font-black tracking-widest uppercase mb-1">
            Esta semana
          </p>
          <h1 className="text-yellow-400 text-3xl font-black leading-tight drop-shadow-lg">
            Missões da Semana
          </h1>
          <p className="text-white/60 text-sm font-semibold mt-1">
            Complete a missão do dia e conquiste sua estrela! ⭐
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-full h-2.5">
              <div
                className="bg-yellow-400 rounded-full h-2.5 transition-all duration-500"
                style={{ width: `${(completedCount / 7) * 100}%` }}
              />
            </div>
            <span className="text-yellow-400 font-black text-sm">{completedCount}/7</span>
          </div>
        </div>
      </div>

      {/* Mission cards */}
      <div className="flex-1 bg-gray-900 px-4 pt-3 pb-4 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-1 gap-3">
          {days.map((day) => {
            const done = !!missions[day.id];
            return (
              <button
                key={day.id}
                onClick={() => toggle(day.id)}
                className="relative overflow-hidden rounded-2xl p-4 text-left active:scale-95 transition-all"
                style={{ background: '#1E293B', border: `1px solid rgba(255,255,255,0.06)` }}
              >
                {/* Top accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: done ? '#22c55e' : day.color }}
                />

                <div className="flex items-start gap-3">
                  <span className="text-3xl leading-none flex-shrink-0">{day.mission.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[10px] font-black tracking-widest uppercase mb-0.5"
                      style={{ color: done ? '#4ade80' : day.color }}
                    >
                      {day.shortName} · {day.name}
                    </div>
                    <div className="text-white font-bold text-sm leading-snug">{day.mission.text}</div>
                  </div>
                  {/* Check */}
                  <div
                    className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border-2 text-sm font-black transition-all"
                    style={{
                      borderColor: done ? '#22c55e' : day.color,
                      background: done ? '#22c55e' : 'rgba(255,255,255,0.05)',
                      color: 'white',
                    }}
                  >
                    {done ? '✓' : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Celebration */}
        {completedCount === 7 && (
          <div className="mt-4 rounded-2xl p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center">
            <div className="text-4xl mb-2">🏆🎉🏆</div>
            <div className="font-black text-lg">Semana perfeita!</div>
            <div className="text-sm font-semibold opacity-90">Você completou todas as missões! Parabéns, Marcus!</div>
          </div>
        )}
      </div>

      <BottomNav active="missoes" />
    </div>
  );
}
