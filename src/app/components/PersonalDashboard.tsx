import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle, Clock, ChevronRight, Flag, Calendar,
  CheckCircle2, Square, Circle, Maximize2, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useTasks, Task } from '../../hooks/useTasks';
import { usePipelineDeals } from '../../hooks/usePipelineDeals';
import { ComponentLoading } from './ComponentLoading';
import { useNavigationStore } from '../../hooks/useNavigation';

// ─── Constants ─────────────────────────────────────────────────────────────────
const TODAY = new Date();
const WEEK_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const DEAL_STAGES: Record<string, { label: string; color: string; bg: string }> = {
  tu_van:      { label: 'Tư vấn',     color: '#60a5fa', bg: '#eff6ff' },
  gui_bao_gia: { label: 'Báo giá',    color: '#1A4F9C', bg: '#dbeafe' },
  dam_phan:    { label: 'Đàm phán',   color: '#B85C00', bg: '#fff7ed' },
  chot_hd:     { label: 'Chốt HĐ',   color: '#0E7C6B', bg: '#f0fdf9' },
  lead:        { label: 'Lead',       color: '#94a3b8', bg: '#f1f5f9' },
  dang_tn:     { label: 'Đang TN',    color: '#059669', bg: '#d1fae5' },
  hoan_thanh:  { label: 'Hoàn thành', color: '#059669', bg: '#d1fae5' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Khẩn', color: '#991f1f', bg: '#fef2f2' },
  high:   { label: 'Cao',  color: '#B85C00', bg: '#fff7ed' },
  medium: { label: 'TB',   color: '#1A4F9C', bg: '#dbeafe' },
  low:    { label: 'Thấp', color: '#0E7C6B', bg: '#f0fdf9' },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type CalendarEvent =
  | { kind: 'task'; id: string; title: string; date: string; priority: string }
  | { kind: 'deal'; id: string; title: string; date: string; value: number; stage: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDate(dStr: string | null): string {
  if (!dStr) return 'No date';
  const d = new Date(dStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function daysDiff(dStr: string | null): number {
  if (!dStr) return 999;
  return Math.round((new Date(dStr).getTime() - TODAY.getTime()) / 86_400_000);
}

const weekDates = (() => {
  const day = TODAY.getDay();
  const monday = new Date(TODAY);
  monday.setDate(TODAY.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
})();

// ─── Sub-components ────────────────────────────────────────────────────────────
function PriorityBadge({ p }: { p: string }) {
  const { label, color, bg } = PRIORITY_MAP[p] ?? PRIORITY_MAP.low;
  return (
    <span className="px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"
      style={{ backgroundColor: bg, color, fontSize: 10, fontWeight: 600 }}>
      <Flag size={9} strokeWidth={2} />
      {label}
    </span>
  );
}

function DonutChart({ done, total }: { done: number; total: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: 84, height: 84 }}>
        <svg width={84} height={84} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={42} cy={42} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
          <circle cx={42} cy={42} r={r} fill="none" stroke="#1A4F9C" strokeWidth={10}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - pct * circ} />
        </svg>
        <div className="absolute text-center">
          <span style={{ color: 'var(--foreground)', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{done}</span>
          <span style={{ color: 'var(--muted-foreground)', fontSize: 10, display: 'block' }}>/{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1A4F9C' }} />
          <span style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)' }}>{done} hoàn thành</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f1f5f9', border: '1.5px solid #cbd5e1' }} />
          <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>{total - done} còn lại</span>
        </div>
        <div className="px-2 py-0.5 rounded-full text-center"
          style={{ backgroundColor: '#eff6ff', color: '#1A4F9C', fontSize: 10, fontWeight: 600 }}>
          {Math.round(pct * 100)}% xong
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle, px = 'px-5' }: { task: Task; onToggle: (id: string, s: string) => void; px?: string }) {
  const done = task.status === 'done';
  const diff = daysDiff(task.due_date);
  const dateColor = diff < 0 && !done ? '#991F1F' : diff === 0 && !done ? '#B85C00' : 'var(--muted-foreground)';
  const dateLabel = diff < 0 && !done ? `Quá hạn ${Math.abs(diff)}n` : diff === 0 && !done ? 'Hôm nay' : formatDate(task.due_date);
  return (
    <div className={`${px} py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer`}
      onClick={() => onToggle(task.id, task.status)}>
      {done
        ? <CheckCircle2 size={17} strokeWidth={1.5} style={{ color: '#0E7C6B', flexShrink: 0 }} />
        : <Circle      size={17} strokeWidth={1.5} style={{ color: '#cbd5e1', flexShrink: 0 }} />}
      <span className="flex-1 truncate" style={{
        color: done ? 'var(--muted-foreground)' : 'var(--foreground)',
        fontSize: 'var(--text-sm)',
        textDecoration: done ? 'line-through' : 'none',
      }}>
        {task.title}
      </span>
      <PriorityBadge p={task.priority} />
      <span style={{ color: dateColor, fontSize: 'var(--text-xs)', whiteSpace: 'nowrap', fontWeight: diff <= 0 && !done ? 600 : 400 }}>
        {dateLabel}
      </span>
    </div>
  );
}

function EventRow({ e, onNavigate }: { e: CalendarEvent; onNavigate: (e: CalendarEvent) => void }) {
  const diff = daysDiff(e.date);
  const diffColor = diff === 0 ? '#B85C00' : diff < 0 ? '#991F1F' : 'var(--muted-foreground)';
  const diffLabel = diff === 0 ? 'Hôm nay' : diff < 0 ? `Quá hạn ${Math.abs(diff)}n` : `+${diff} ngày`;
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 cursor-pointer hover:shadow-md transition-shadow"
      style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
      onClick={() => onNavigate(e)}>
      <div className="w-1.5 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: e.kind === 'deal' ? '#0E7C6B' : '#1A4F9C', minHeight: 32 }} />
      <div className="flex-1 min-w-0">
        <p style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{e.title}</p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-xs)', marginTop: 2 }}>
          {e.kind === 'deal'
            ? `${DEAL_STAGES[e.stage]?.label ?? e.stage} · ${(e.value / 1_000_000).toFixed(0)}tr ₫`
            : formatDate(e.date)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${e.kind === 'deal' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
          {e.kind === 'deal' ? 'Deal' : 'Task'}
        </span>
        <span style={{ color: diffColor, fontSize: 10, fontWeight: 600 }}>{diffLabel}</span>
      </div>
    </div>
  );
}

function WeekPicker({ selectedDate, calendarEvents, onSelect, cellSize = 32 }: {
  selectedDate: string | null;
  calendarEvents: CalendarEvent[];
  onSelect: (iso: string | null) => void;
  cellSize?: number;
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {weekDates.map((date, i) => {
        const isToday    = date.toDateString() === TODAY.toDateString();
        const isSelected = !!selectedDate && new Date(selectedDate).toDateString() === date.toDateString();
        const hasEvent   = calendarEvents.some(e => new Date(e.date).toDateString() === date.toDateString());
        return (
          <div key={i} className="flex flex-col items-center gap-1 cursor-pointer"
            onClick={() => onSelect(isSelected ? null : date.toISOString())}>
            <span style={{ color: 'var(--muted-foreground)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>
              {WEEK_DAYS[date.getDay()]}
            </span>
            <div className="rounded-full flex items-center justify-center relative transition-colors"
              style={{
                width: cellSize, height: cellSize,
                backgroundColor: isToday ? '#1A4F9C' : isSelected ? '#dbeafe' : 'transparent',
                border: isSelected && !isToday ? '1.5px solid #1A4F9C' : undefined,
              }}>
              <span style={{ color: isToday ? '#fff' : isSelected ? '#1A4F9C' : 'var(--foreground)', fontSize: 'var(--text-sm)', fontWeight: isToday || isSelected ? 700 : 400 }}>
                {date.getDate()}
              </span>
              {hasEvent && !isToday && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-500" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', animation: 'fade-in 0.2s ease' }}
      onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col"
        style={{ backgroundColor: 'var(--card)', maxHeight: '82vh', boxShadow: '0 32px 80px rgba(0,0,0,0.28)', animation: 'modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="px-6 py-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <h2 style={{ color: 'var(--foreground)', fontSize: 18, fontWeight: 700 }}>{title}</h2>
        {subtitle && <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-xs)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
        <X size={16} style={{ color: 'var(--muted-foreground)' }} />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function PersonalDashboard() {
  const { user } = useAuth();
  const { setActiveTab, setHighlightDealId } = useNavigationStore();
  const [selectedDate, setSelectedDate]       = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen]     = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const { data: statsData, isLoading: isLoadingStats, isError: isErrorStats, error: errStats } = useDashboardStats();
  const { deals, isLoading: isLoadingDeals, isError: isErrorDeals, error: errDeals }           = usePipelineDeals({});
  const { tasks, updateStatus }                        = useTasks();

  // Lock main scroller while any modal is open
  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    if (!main) return;
    main.style.overflow = taskModalOpen || calendarModalOpen ? 'hidden' : '';
    return () => { main.style.overflow = ''; };
  }, [taskModalOpen, calendarModalOpen]);

  const now = useMemo(() => new Date(), []);

  const toggleTask = useCallback((id: string, currentStatus: string) => {
    updateStatus({ taskId: id, status: currentStatus === 'done' ? 'todo' : 'done' });
  }, [updateStatus]);

  const todayTasks = useMemo(() =>
    tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === TODAY.toDateString()),
    [tasks]);

  const myPerformance = useMemo(() =>
    statsData?.employeePerformance.find(p => p.email === user?.email) ?? statsData?.employeePerformance?.[0],
    [statsData, user?.email]);

  const target         = myPerformance?.targetMonthly  ?? 200_000_000;
  const actual         = myPerformance?.actualRevenue  ?? 0;
  const pct            = Math.min((actual / target) * 100, 100);
  const remainingTarget = Math.max(target - actual, 0);

  const daysLeft = useMemo(() => {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  }, [now]);

  const dealsByStage = useMemo(() =>
    Object.entries(
      deals.reduce((acc, deal) => {
        (acc[deal.stage] ??= []).push(deal);
        return acc;
      }, {} as Record<string, typeof deals>)
    ).map(([stage, stageDeals]) => ({
      id: stage,
      ...(DEAL_STAGES[stage] ?? DEAL_STAGES.lead),
      deals: stageDeals,
    })),
    [deals]);

  const calendarEvents = useMemo((): CalendarEvent[] => [
    ...tasks
      .filter(t => t.due_date && daysDiff(t.due_date) >= 0 && daysDiff(t.due_date) <= 7 && t.status !== 'done')
      .map(t => ({ kind: 'task' as const, id: t.id, title: t.title, date: t.due_date!, priority: t.priority })),
    ...deals
      .filter(d => d.expected_close_date && daysDiff(d.expected_close_date) >= 0 && daysDiff(d.expected_close_date) <= 7)
      .map(d => ({ kind: 'deal' as const, id: d.id, title: d.title, date: d.expected_close_date!, value: d.value, stage: d.stage })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [tasks, deals]);

  const visibleEvents = useMemo(() =>
    selectedDate
      ? calendarEvents.filter(e => new Date(e.date).toDateString() === new Date(selectedDate).toDateString())
      : calendarEvents,
    [calendarEvents, selectedDate]);

  const handleNavigateEvent = useCallback((e: CalendarEvent) => {
    setCalendarModalOpen(false);
    if (e.kind === 'deal') { setHighlightDealId(e.id); setActiveTab('pipeline'); }
    else { setActiveTab('tasks'); }
  }, [setHighlightDealId, setActiveTab]);

  const handleNavigateEventPanel = useCallback((e: CalendarEvent) => {
    if (e.kind === 'deal') { setHighlightDealId(e.id); setActiveTab('pipeline'); }
    else { setActiveTab('tasks'); }
  }, [setHighlightDealId, setActiveTab]);

  if (isLoadingStats || isLoadingDeals) {
    return <ComponentLoading message="Đang cá nhân hóa dữ liệu của bạn..." size="lg" />;
  }

  if (isErrorStats || isErrorDeals) {
    const msg = (errStats || errDeals) instanceof Error
      ? (errStats || errDeals)!.message
      : 'Không thể tải dữ liệu';
    console.error('[PersonalDashboard] query error:', errStats, errDeals);
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-sm text-red-500">
        <span>⚠ Lỗi tải dữ liệu: {msg}</span>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  const doneCount        = todayTasks.filter(t => t.status === 'done').length;
  const totalCount       = todayTasks.length;
  const urgentDealsCount = deals.filter(d => daysDiff(d.expected_close_date) <= 7).length;
  const tasksDoneCount   = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6" style={{ backgroundColor: 'var(--background)' }}>

      {/* ── HEADER ── */}
      <div>
        <h1 style={{ color: 'var(--foreground)', fontSize: 22, fontWeight: 600 }}>
          Xin chào, {user?.name || 'Bạn'} 👋
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 3 }}>
          {WEEK_DAYS[now.getDay()]}, {now.toLocaleDateString('vi-VN')}
        </p>
      </div>

      {/* ── TARGET PROGRESS ── */}
      <div className="rounded-xl px-4 py-4 md:px-8 md:py-6" style={{ background: 'linear-gradient(135deg, #1A4F9C 0%, #0e3470 60%, #0b2554 100%)', boxShadow: '0 4px 20px rgba(26,79,156,0.35)' }}>
        <div className="flex flex-col md:flex-row items-stretch md:items-start md:justify-between gap-4 md:gap-8">
          <div className="flex-1 w-full">
            <p className="text-white/70" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              Target tháng {now.getMonth() + 1}
            </p>
            <p className="text-white mt-0.5" style={{ fontSize: 22, fontWeight: 700 }}>
              {target.toLocaleString('vi-VN')} ₫
            </p>
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80" style={{ fontSize: 'var(--text-sm)' }}>Tiến độ hoàn thành</span>
                <span className="text-white" style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{pct.toFixed(1)}%</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.18)' }}>
                <div className="h-full rounded-full relative overflow-hidden transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: '#34d399' }}>
                  <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' }} />
                </div>
              </div>
              <div className="flex items-center gap-8 mt-3">
                <div>
                  <span className="text-white/60" style={{ fontSize: 'var(--text-xs)' }}>Đã đạt</span>
                  <p className="text-white" style={{ fontWeight: 700, fontSize: 15, marginTop: 1 }}>{actual.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div>
                  <span className="text-white/60" style={{ fontSize: 'var(--text-xs)' }}>Còn lại</span>
                  <p className="text-white" style={{ fontWeight: 700, fontSize: 15, marginTop: 1 }}>{remainingTarget.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl px-5 py-4 w-full md:w-auto md:shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)', minWidth: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} strokeWidth={1.5} className="text-white/70" />
              <span className="text-white/70" style={{ fontSize: 'var(--text-sm)' }}>Thời gian còn lại</span>
            </div>
            <p className="text-white" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{daysLeft}</p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: 'var(--text-sm)' }}>ngày để hoàn thành</p>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <p className="text-white/60" style={{ fontSize: 'var(--text-xs)' }}>
                Cần đạt ~{daysLeft > 0 ? Math.round(remainingTarget / daysLeft).toLocaleString('vi-VN') : 0} ₫/ngày
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
        {/* SLA */}
        <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>Cảnh báo SLA hôm nay</p>
              <p style={{ color: '#991F1F', fontSize: 44, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>
                {statsData?.alerts.slaViolations ?? 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
              <AlertCircle size={22} strokeWidth={1.5} style={{ color: '#991F1F' }} />
            </div>
          </div>
          <button onClick={() => setActiveTab('sla')} className="mt-4 cursor-pointer w-full flex items-center justify-center gap-1.5 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#991F1F', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Xem chi tiết vi phạm <ChevronRight size={13} strokeWidth={2} />
          </button>
        </div>

        {/* Today tasks */}
        <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>Task hôm nay</p>
            <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#1A4F9C', fontSize: 10, fontWeight: 600 }}>
              {doneCount}/{totalCount} xong
            </span>
          </div>
          <DonutChart done={doneCount} total={totalCount} />
          <div className="mt-4 pt-4 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
            {todayTasks.filter(t => t.status !== 'done').slice(0, 2).map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1">
                <button onClick={() => toggleTask(t.id, t.status)}>
                  <Square size={14} strokeWidth={1.5} style={{ color: '#cbd5e1' }} />
                </button>
                <span className="truncate" style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)', flex: 1 }}>{t.title}</span>
                <PriorityBadge p={t.priority} />
              </div>
            ))}
            {todayTasks.filter(t => t.status !== 'done').length === 0 && (
              <div className="text-center text-sm text-gray-500 py-1">Đã hoàn thành tất cả task hôm nay!</div>
            )}
          </div>
        </div>
      </div>

      {/* ── DEALS + TASKS/CALENDAR ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">

        {/* LEFT: Deals */}
        <div className="rounded-lg overflow-hidden flex flex-col h-[400px] md:h-[500px]" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div>
              <h2 style={{ color: 'var(--foreground)', fontSize: 'var(--text-lg)' }}>Deals của tôi</h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 2 }}>{deals.length} deals đang mở</p>
            </div>
            <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              ⚠ {urgentDealsCount} sắp đến hạn
            </span>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto custom-scroll flex-1">
            {dealsByStage.map(stage => (
              <div key={stage.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: stage.bg, color: stage.color, fontSize: 11, fontWeight: 600 }}>{stage.label}</span>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-xs)' }}>{stage.deals.length} deals</span>
                </div>
                <div className="space-y-2 pl-1">
                  {stage.deals.map(deal => {
                    const diff   = daysDiff(deal.expected_close_date);
                    const urgent = diff <= 7;
                    return (
                      <div key={deal.id}
                        className="rounded-lg px-3.5 py-3 flex items-start justify-between gap-3 cursor-pointer hover:shadow-sm transition-shadow"
                        style={{ backgroundColor: urgent ? '#fff9f9' : '#f8fafc', border: `1px solid ${urgent ? '#fecaca' : '#e2e8f0'}` }}
                        onClick={() => { setHighlightDealId(deal.id); setActiveTab('pipeline'); }}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate" style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{deal.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={11} strokeWidth={1.5} style={{ color: urgent ? '#991F1F' : 'var(--muted-foreground)' }} />
                            <span style={{ color: urgent ? '#991F1F' : 'var(--muted-foreground)', fontSize: 'var(--text-xs)', fontWeight: urgent ? 600 : 400 }}>
                              {formatDate(deal.expected_close_date)}
                              {urgent && diff > 0 && ` (${diff} ngày)`}
                              {diff === 0 && ' (Hôm nay!)'}
                              {diff < 0 && ` (Quá hạn ${Math.abs(diff)} ngày)`}
                            </span>
                          </div>
                        </div>
                        <span style={{ color: '#1A4F9C', fontSize: 'var(--text-sm)', fontWeight: 600, flexShrink: 0 }}>
                          {(deal.value / 1_000_000).toFixed(0)}tr ₫
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {deals.length === 0 && <div className="text-center text-sm text-gray-500 py-4">Chưa có deal nào.</div>}
          </div>
        </div>

        {/* RIGHT: Tasks + Calendar panels */}
        <div className="flex flex-col gap-5">

          {/* Task panel */}
          <div className="rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
              <h2 style={{ color: 'var(--foreground)', fontSize: 'var(--text-lg)' }}>Tất cả Nhiệm vụ</h2>
              <button onClick={() => setTaskModalOpen(true)} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Xem đầy đủ">
                <Maximize2 size={15} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)', maxHeight: 280, overflow: 'hidden' }}>
              {tasks.slice(0, 5).map(task => <TaskRow key={task.id} task={task} onToggle={toggleTask} />)}
              {tasks.length === 0 && <div className="text-center text-sm text-gray-500 py-4">Không có nhiệm vụ nào.</div>}
            </div>
            {tasks.length > 5 && (
              <button onClick={() => setTaskModalOpen(true)} className="w-full py-2.5 text-center hover:bg-slate-50 transition-colors" style={{ borderTop: '1px solid var(--border)', color: '#1A4F9C', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                Xem tất cả {tasks.length} nhiệm vụ →
              </button>
            )}
          </div>

          {/* Calendar panel */}
          <div className="rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="px-5 py-4 border-b shrink-0 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h2 style={{ color: 'var(--foreground)', fontSize: 'var(--text-lg)' }}>Tiến độ 7 ngày tới</h2>
              <button onClick={() => setCalendarModalOpen(true)} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Xem đầy đủ">
                <Maximize2 size={15} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
            <div className="px-5 py-3 shrink-0">
              <WeekPicker selectedDate={selectedDate} calendarEvents={calendarEvents} onSelect={setSelectedDate} />
            </div>
            <div className="px-5 pb-4 pt-2 space-y-2" style={{ borderTop: '1px solid var(--border)', maxHeight: 200, overflow: 'hidden' }}>
              {visibleEvents.slice(0, 3).map(e => (
                <div key={e.kind + e.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer hover:shadow-sm transition-shadow"
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  onClick={() => handleNavigateEventPanel(e)}>
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: e.kind === 'deal' ? '#0E7C6B' : '#1A4F9C', minHeight: 28 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{e.title}</p>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-xs)', marginTop: 1 }}>
                      {e.kind === 'deal' ? `${DEAL_STAGES[e.stage]?.label ?? e.stage} · ${(e.value / 1_000_000).toFixed(0)}tr ₫` : formatDate(e.date)}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${e.kind === 'deal' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                    {e.kind === 'deal' ? 'Deal' : 'Task'} +{daysDiff(e.date)}n
                  </span>
                </div>
              ))}
              {visibleEvents.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  {selectedDate ? 'Không có sự kiện ngày này' : 'Trống lịch'}
                </div>
              )}
            </div>
            {visibleEvents.length > 3 && (
              <button onClick={() => setCalendarModalOpen(true)} className="w-full py-2.5 text-center hover:bg-slate-50 transition-colors" style={{ borderTop: '1px solid var(--border)', color: '#1A4F9C', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                Xem tất cả {visibleEvents.length} sự kiện →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: Tasks ── */}
      {taskModalOpen && createPortal(
        <ModalShell onClose={() => setTaskModalOpen(false)}>
          <ModalHeader
            title="Tất cả Nhiệm vụ"
            subtitle={`${tasks.length} nhiệm vụ · ${tasksDoneCount} hoàn thành`}
            onClose={() => setTaskModalOpen(false)}
          />
          <div className="overflow-y-auto custom-scroll flex-1 divide-y" style={{ borderColor: 'var(--border)' }}>
            {tasks.map(task => <TaskRow key={task.id} task={task} onToggle={toggleTask} px="px-6" />)}
            {tasks.length === 0 && <div className="text-center text-sm text-gray-500 py-10">Không có nhiệm vụ nào.</div>}
          </div>
        </ModalShell>,
        document.body
      )}

      {/* ── MODAL: Calendar ── */}
      {calendarModalOpen && createPortal(
        <ModalShell onClose={() => setCalendarModalOpen(false)}>
          <ModalHeader
            title="Tiến độ 7 ngày tới"
            subtitle={`${calendarEvents.length} sự kiện sắp tới`}
            onClose={() => setCalendarModalOpen(false)}
          />
          <div className="px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <WeekPicker selectedDate={selectedDate} calendarEvents={calendarEvents} onSelect={setSelectedDate} cellSize={36} />
          </div>
          <div className="overflow-y-auto custom-scroll flex-1 px-6 py-4 space-y-2.5">
            {visibleEvents.map(e => <EventRow key={e.kind + e.id} e={e} onNavigate={handleNavigateEvent} />)}
            {visibleEvents.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-10">
                {selectedDate ? 'Không có sự kiện ngày này' : 'Trống lịch'}
              </div>
            )}
          </div>
        </ModalShell>,
        document.body
      )}
    </div>
  );
}
