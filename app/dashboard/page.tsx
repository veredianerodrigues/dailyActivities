'use client';

import { useEffect, useState } from 'react';
import {
  getCustomDays,
  getLast7DaysProgress,
  getWeekMissionCount,
  getThisWeekMissions,
  DailyProgress,
} from '@/lib/store';
import { DayConfig } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

export default function DashboardPage() {
  const [days, setDays] = useState<DayConfig[]>([]);
  const [last7, setLast7] = useState<DailyProgress[]>([]);
  const [missionStats, setMissionStats] = useState({ completed: 0, total: 7 });
  const [weekMissions, setWeekMissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loaded = getCustomDays();
    setDays(loaded);
    setLast7(getLast7DaysProgress(loaded));
    setMissionStats(getWeekMissionCount());
    setWeekMissions(getThisWeekMissions());
  }, []);

  const today = last7[last7.length - 1];
  const weekTotal = last7.reduce((sum, d) => sum + d.total, 0);
  const weekCompleted = last7.reduce((sum, d) => sum + d.completed, 0);
  const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  const maxCompleted = Math.max(...last7.map((d) => d.total), 1);

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-10 pb-5">
        <p className="text-gray-400 text-xs font-black tracking-widest uppercase mb-1">Progresso</p>
        <h1 className="text-gray-900 text-2xl font-black">Dashboard 📊</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 flex flex-col gap-4">
        {/* Today card */}
        {today && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-400 text-xs font-black tracking-widest uppercase mb-3">Hoje</p>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="26" fill="none" stroke="#3B82F6" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - today.percent / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-800">{today.percent}%</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">
                  {today.completed}
                  <span className="text-gray-400 font-semibold text-base">/{today.total}</span>
                </div>
                <div className="text-sm text-gray-500 font-semibold">tarefas concluídas</div>
                {today.percent === 100 && (
                  <div className="text-xs font-black text-green-600 mt-0.5">🎉 Dia perfeito!</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Last 7 days chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black tracking-widest uppercase mb-3">
            Últimos 7 dias
          </p>
          <div className="flex items-end gap-2 h-24">
            {last7.map((d, i) => {
              const height = d.total > 0 ? (d.completed / maxCompleted) * 100 : 0;
              const isToday = i === 6;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] font-black text-gray-400">{d.percent}%</div>
                  <div className="w-full flex items-end" style={{ height: 60 }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(height, d.total > 0 ? 8 : 0)}%`,
                        background: isToday ? '#3B82F6' : d.percent >= 80 ? '#10B981' : d.percent >= 50 ? '#F59E0B' : '#E5E7EB',
                      }}
                    />
                  </div>
                  <div
                    className="text-[10px] font-black"
                    style={{ color: isToday ? '#3B82F6' : '#9CA3AF' }}
                  >
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500 font-semibold">Total da semana</span>
            <span className="font-black text-gray-900">
              {weekCompleted}/{weekTotal} ({weekPercent}%)
            </span>
          </div>
        </div>

        {/* Missions this week */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black tracking-widest uppercase mb-3">
            Missões desta semana
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl font-black text-gray-900">{missionStats.completed}</div>
            <div className="text-gray-400 font-semibold text-sm">de 7 missões<br />concluídas</div>
            <div className="ml-auto">
              <div className="text-2xl">
                {missionStats.completed >= 7
                  ? '🏆'
                  : missionStats.completed >= 5
                  ? '🥈'
                  : missionStats.completed >= 3
                  ? '🥉'
                  : '⭐'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const done = !!weekMissions[day.id];
              return (
                <div
                  key={day.id}
                  className="flex flex-col items-center gap-0.5"
                  title={day.shortName}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-black text-white"
                    style={{ background: done ? day.color : '#F3F4F6' }}
                  >
                    {done ? '✓' : <span className="text-gray-300 text-xs">—</span>}
                  </div>
                  <div className="text-[9px] text-gray-400 font-bold">{day.shortName}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational footer */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-4 text-white">
          <div className="font-black text-base">
            {weekPercent >= 80
              ? '🌟 Semana incrível! Continue assim!'
              : weekPercent >= 50
              ? '💪 Boa semana! Você está no caminho certo!'
              : '🚀 Vamos juntos! Cada tarefa conta!'}
          </div>
          <div className="text-white/70 text-sm font-semibold mt-1">
            {weekCompleted} tarefas completadas esta semana
          </div>
        </div>
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}
