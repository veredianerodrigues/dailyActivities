'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  verifyPin,
  setPin as storeSetPin,
  getCustomDays,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  reorderTasksApi,
  updateMissionApi,
} from '@/lib/store';
import { DayConfig, Task } from '@/lib/types';
import { DEFAULT_DAYS } from '@/lib/data';

// ─── PIN Gate ─────────────────────────────────────────────────────────────────
function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const tryPin = async (value: string) => {
    if (value.length < 4 || checking) return;
    setChecking(true);
    const valid = await verifyPin(value);
    setChecking(false);
    if (valid) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1000);
    }
  };

  const press = (digit: string) => {
    if (digit === '←') { setPin((p) => p.slice(0, -1)); return; }
    const next = pin + digit;
    setPin(next);
    tryPin(next);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 items-center justify-center px-8">
      <div className="text-4xl mb-4">🔐</div>
      <h1 className="text-white font-black text-2xl mb-1">Painel Admin</h1>
      <p className="text-gray-400 font-semibold text-sm mb-8">Digite o PIN para continuar</p>

      <div className="flex gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all"
            style={{ background: error ? '#EF4444' : pin.length > i ? '#6366F1' : '#374151' }}
          />
        ))}
      </div>
      {error && <p className="text-red-400 text-sm font-bold mb-4">PIN incorreto</p>}

      <div className="grid grid-cols-3 gap-3 w-60">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => k && press(k)}
            disabled={!k || checking}
            className="h-14 rounded-2xl font-black text-xl transition-all active:scale-90"
            style={{ background: k ? '#1E293B' : 'transparent', color: '#fff' }}
          >
            {k}
          </button>
        ))}
      </div>

      <Link href="/" className="mt-8 text-gray-500 text-sm font-semibold underline">
        Cancelar
      </Link>
    </div>
  );
}

// ─── Sortable Task Item ───────────────────────────────────────────────────────
function SortableTaskItem({
  task,
  dayColor,
  onEdit,
  onDelete,
}: {
  task: Task;
  dayColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2 border border-gray-100 touch-none"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-300 cursor-grab active:cursor-grabbing px-1 text-lg select-none"
        tabIndex={-1}
        aria-label="Arrastar"
      >
        ⠿
      </button>
      <span className="text-lg">{task.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-800 truncate">{task.name}</div>
        {task.time && <div className="text-[10px] text-gray-400 font-semibold">{task.time}</div>}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-indigo-400 text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-red-400 text-xs font-bold px-2 py-1 rounded-lg bg-red-50"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [days, setDays] = useState<DayConfig[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [tab, setTab] = useState<'tasks' | 'settings'>('tasks');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [seedMsg, setSeedMsg] = useState('');

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  useEffect(() => {
    if (unlocked) getCustomDays().then(setDays);
  }, [unlocked]);

  const currentDay = days.find((d) => d.id === selectedDay);

  // ── Task CRUD ──
  const deleteTask = useCallback(async (dayId: string, taskId: string) => {
    setDays((prev) =>
      prev.map((d) => d.id === dayId ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) } : d),
    );
    await deleteTaskApi(taskId);
  }, []);

  const upsertTask = useCallback(async (dayId: string, task: Task) => {
    const day = days.find((d) => d.id === dayId);
    const exists = day?.tasks.some((t) => t.id === task.id) ?? false;

    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          tasks: exists
            ? d.tasks.map((t) => (t.id === task.id ? task : t))
            : [...d.tasks, task],
        };
      }),
    );
    setEditingTask(null);

    if (exists) {
      await updateTaskApi(task);
    } else {
      await createTaskApi(dayId, task);
    }
  }, [days]);

  const updateMission = useCallback(async (dayId: string, text: string) => {
    setDays((prev) =>
      prev.map((d) => d.id === dayId ? { ...d, mission: { ...d.mission, text } } : d),
    );
    await updateMissionApi(dayId, text);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentDay) return;

    const oldIndex = currentDay.tasks.findIndex((t) => t.id === active.id);
    const newIndex = currentDay.tasks.findIndex((t) => t.id === over.id);
    const newTasks = arrayMove(currentDay.tasks, oldIndex, newIndex);

    setDays((prev) =>
      prev.map((d) => d.id === currentDay.id ? { ...d, tasks: newTasks } : d),
    );
    await reorderTasksApi(newTasks.map((t) => t.id));
  }, [currentDay]);

  if (!unlocked) return <PinGate onSuccess={() => setUnlocked(true)} />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 px-5 pt-10 pb-5 flex items-center gap-3">
        <Link href="/" className="text-gray-400 text-2xl">←</Link>
        <div>
          <h1 className="text-white font-black text-xl">Admin</h1>
          <p className="text-gray-400 text-xs font-semibold">Editar rotina do Marcus</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setTab('tasks')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: tab === 'tasks' ? '#6366F1' : '#1E293B', color: 'white' }}
          >
            Tarefas
          </button>
          <button
            type="button"
            onClick={() => setTab('settings')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: tab === 'settings' ? '#6366F1' : '#1E293B', color: 'white' }}
          >
            Config
          </button>
        </div>
      </div>

      {tab === 'tasks' && (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Day selector */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-gray-400 text-xs font-black tracking-widest uppercase mb-2">Selecione o dia</p>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDay(d.id)}
                  className="flex flex-col items-center p-2 rounded-xl text-center transition-all active:scale-90"
                  style={{
                    background: selectedDay === d.id ? d.color : d.lightColor,
                    border: `2px solid ${selectedDay === d.id ? d.color : 'transparent'}`,
                  }}
                >
                  <span className="text-base">{d.emoji}</span>
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: selectedDay === d.id ? 'white' : d.darkColor }}
                  >
                    {d.shortName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {currentDay && (
            <div className="px-4 pb-6">
              {/* Mission */}
              <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
                <p className="text-gray-400 text-xs font-black tracking-widest uppercase mb-2">
                  ⭐ Missão do Dia
                </p>
                <input
                  defaultValue={currentDay.mission.text}
                  onBlur={(e) => updateMission(currentDay.id, e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Tasks list */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs font-black tracking-widest uppercase">
                  Tarefas ({currentDay.tasks.length})
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEditingTask({
                      id: `${currentDay.id}_${Date.now()}`,
                      name: '',
                      emoji: '✅',
                      time: '',
                    })
                  }
                  className="text-xs font-black px-3 py-1.5 rounded-lg text-white"
                  style={{ background: currentDay.color }}
                >
                  + Adicionar
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={currentDay.tasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2">
                    {currentDay.tasks.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        dayColor={currentDay.color}
                        onEdit={() => setEditingTask(task)}
                        onDelete={() => deleteTask(currentDay.id, task.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {!selectedDay && (
            <div className="text-center text-gray-400 font-semibold text-sm pt-12">
              Selecione um dia para editar
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="flex-1 px-4 pt-4 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {/* Change PIN */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="font-black text-gray-800 mb-1">🔐 Alterar PIN</p>
            <p className="text-gray-400 text-xs font-semibold mb-3">Somente números, 4 dígitos</p>
            <div className="flex gap-2">
              <input
                type="number"
                maxLength={4}
                placeholder="Novo PIN (4 dígitos)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold focus:outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={async () => {
                  if (newPin.length === 4) {
                    await storeSetPin(newPin);
                    setNewPin('');
                    setPinMsg('PIN alterado com sucesso! ✅');
                    setTimeout(() => setPinMsg(''), 3000);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-black text-sm"
              >
                Salvar
              </button>
            </div>
            {pinMsg && <p className="text-green-600 text-xs font-bold mt-2">{pinMsg}</p>}
          </div>

          {/* Initialize DB */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="font-black text-gray-800 mb-1">🗄️ Inicializar banco de dados</p>
            <p className="text-gray-400 text-xs font-semibold mb-3">
              Popula o banco com as tarefas padrão. Use na primeira vez ou após criar as tabelas.
            </p>
            <button
              type="button"
              onClick={async () => {
                setSeedMsg('Inicializando...');
                const res = await fetch('/api/days/seed', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
                setSeedMsg(res.ok ? 'Banco inicializado! ✅' : 'Erro ao inicializar ❌');
                if (res.ok) {
                  const loaded = await getCustomDays();
                  setDays(loaded);
                }
                setTimeout(() => setSeedMsg(''), 4000);
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-black text-sm"
            >
              Inicializar BD
            </button>
            {seedMsg && <p className="text-indigo-600 text-xs font-bold mt-2">{seedMsg}</p>}
          </div>

          {/* Reset tasks */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="font-black text-gray-800 mb-1">🔄 Restaurar tarefas padrão</p>
            <p className="text-gray-400 text-xs font-semibold mb-3">
              Apaga todas as edições e volta às tarefas originais.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Confirma? Todas as edições serão perdidas.')) return;
                await fetch('/api/days/seed', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reset: true }),
                });
                const loaded = await getCustomDays();
                setDays(loaded);
                setSelectedDay(null);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-black text-sm"
            >
              Restaurar padrão
            </button>
          </div>

          {/* Clear completions */}
          <div className="bg-white rounded-2xl p-4 border border-red-100">
            <p className="font-black text-gray-800 mb-1">🗑️ Limpar histórico de conclusões</p>
            <p className="text-gray-400 text-xs font-semibold mb-3">
              Remove todos os checkmarks salvos. As tarefas em si continuam.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Confirma? O histórico será apagado permanentemente.')) return;
                await fetch('/api/completions', { method: 'DELETE' });
                alert('Histórico limpo!');
              }}
              className="w-full py-2.5 rounded-xl bg-red-500 text-white font-black text-sm"
            >
              Limpar histórico
            </button>
          </div>
        </div>
      )}

      {/* Task edit modal */}
      {editingTask && currentDay && (
        <TaskEditor
          task={editingTask}
          dayColor={currentDay.color}
          onSave={(t) => upsertTask(currentDay.id, t)}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

// ─── Task Editor Modal ────────────────────────────────────────────────────────
function TaskEditor({
  task,
  dayColor,
  onSave,
  onClose,
}: {
  task: Task;
  dayColor: string;
  onSave: (t: Task) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Task>({ ...task });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-5 pb-8 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-black text-gray-900 text-lg">
            {form.name ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <div className="flex gap-2">
          <div className="flex-shrink-0">
            <label htmlFor="task-emoji" className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Emoji</label>
            <input
              id="task-emoji"
              value={form.emoji}
              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
              aria-label="Emoji da tarefa"
              className="w-16 h-11 text-2xl text-center border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome da tarefa"
              className="w-full h-11 border border-gray-200 rounded-xl px-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Horário</label>
            <input
              value={form.time ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              placeholder="Ex: 14:00"
              className="w-full h-11 border border-gray-200 rounded-xl px-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Observação</label>
            <input
              value={form.note ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Opcional"
              className="w-full h-11 border border-gray-200 rounded-xl px-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className="w-6 h-6 rounded-lg border-2 flex items-center justify-center font-black text-white text-xs transition-all"
            style={{ borderColor: dayColor, background: form.isMission ? dayColor : 'transparent' }}
          >
            {form.isMission ? '✓' : ''}
          </div>
          <input
            type="checkbox"
            className="sr-only"
            checked={!!form.isMission}
            onChange={(e) => setForm((f) => ({ ...f, isMission: e.target.checked }))}
          />
          <span className="text-sm font-bold text-gray-700">É a missão principal do dia ⭐</span>
        </label>

        <button
          type="button"
          onClick={() => form.name.trim() && onSave(form)}
          className="w-full py-3.5 rounded-2xl text-white font-black text-base"
          style={{ background: dayColor }}
        >
          Salvar tarefa
        </button>
      </div>
    </div>
  );
}
