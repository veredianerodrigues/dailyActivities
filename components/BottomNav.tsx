'use client';

import Link from 'next/link';
import { todayDayId } from '@/lib/store';

type NavTab = 'home' | 'rotina' | 'missoes' | 'dashboard';

const tabs = [
  { id: 'home', label: 'Início', emoji: '🏠', href: '/' },
  { id: 'rotina', label: 'Rotina', emoji: '📋', href: `/rotina/${typeof window !== 'undefined' ? todayDayId() : 'segunda'}` },
  { id: 'missoes', label: 'Missões', emoji: '🏆', href: '/missoes' },
  { id: 'dashboard', label: 'Stats', emoji: '📊', href: '/dashboard' },
] as const;

export default function BottomNav({ active }: { active: NavTab }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex items-center safe-bottom z-40">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:bg-gray-50 transition-colors"
          >
            <span className="text-xl leading-none">{tab.emoji}</span>
            <span
              className="text-[10px] font-black"
              style={{ color: isActive ? '#6366F1' : '#9CA3AF' }}
            >
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute bottom-0 w-6 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
