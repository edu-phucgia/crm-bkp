import {
  AlertCircle,
  Clock, ChevronRight, Flag, Calendar,
  CheckCircle2, Square, Circle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useTasks } from '../../hooks/useTasks';
import { usePipelineDeals } from '../../hooks/usePipelineDeals';
import { ComponentLoading } from './ComponentLoading';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TODAY = new Date();

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDate(dStr: string | null) {
  if (!dStr) return 'No date';
  const d = new Date(dStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function daysDiff(dStr: string | null) {
  if (!dStr) return 999;
  const d = new Date(dStr);
  const ms = d.getTime() - TODAY.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

const dealStages: Record<string, { label: string; color: string; bg: string }> = {
  'tu_van': { label: 'Tư vấn', color: '#60a5fa', bg: '#eff6ff' },
  'gui_bao_gia': { label: 'Báo giá', color: '#1A4F9C', bg: '#dbeafe' },
  'dam_phan': { label: 'Đàm phán', color: '#B85C00', bg: '#fff7ed' },
  'chot_hd': { label: 'Chốt HĐ', color: '#0E7C6B', bg: '#f0fdf9' },
  'lead': { label: 'Lead', color: '#94a3b8', bg: '#f1f5f9' },
  'dang_tn': { label: 'Đang TN', color: '#059669', bg: '#d1fae5' },
};

const WEEK_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getWeekDates(from: Date) {
  const day = from.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(from);
  monday.setDate(from.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const weekDates = getWeekDates(TODAY);

function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    urgent: { label: 'Khẩn', color: '#991f1f', bg: '#fef2f2' },
    high: { label: 'Cao', color: '#B85C00', bg: '#fff7ed' },
    medium: { label: 'TB', color: '#1A4F9C', bg: '#dbeafe' },
    low: { label: 'Thấp', color: '#0E7C6B', bg: '#f0fdf9' },
  };
  const { label, color, bg } = map[p] || map.low;
  return (
    <span
      className="px-1.5 py-0.5 rounded flex items-center gap-1"
      style={{ backgroundColor: bg, color, fontSize: 10, fontWeight: 600 }}
    >
      <Flag size={9} strokeWidth={2} />
      {label}
    </span>
  );
}

function DonutChart({ done, total }: { done: number; total: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  const offset = circ - pct * circ;
  const remaining = total - done;
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: 84, height: 84 }}>
        <svg width={84} height={84} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={42} cy={42} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
          <circle
            cx={42} cy={42} r={r} fill="none"
            stroke="#1A4F9C" strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
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
          <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>{remaining} còn lại</span>
        </div>
        <div
          className="px-2 py-0.5 rounded-full text-center"
          style={{ backgroundColor: '#eff6ff', color: '#1A4F9C', fontSize: 10, fontWeight: 600 }}
        >
          {Math.round(pct * 100)}% xong
        </div>
      </div>
    </div>
  );
}

export function PersonalDashboard() {
  const { user } = useAuth();
  
  // Real API Calls
  const { data: statsData, isLoading: isLoadingStats } = useDashboardStats();
  const { deals, isLoading: isLoadingDeals } = usePipelineDeals({});
  const { tasks, updateStatus } = useTasks();

  if (isLoadingStats || isLoadingDeals) {
    return <ComponentLoading message="Đang cá nhân hóa dữ liệu của bạn..." size="lg" />;
  }

  // Task processing
  const todayTasks = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === TODAY.toDateString());
  const doneCount = todayTasks.filter(t => t.status === 'done').length;
  const totalCount = todayTasks.length;

  const toggleTask = (id: string, currentStatus: string) => {
    updateStatus({ taskId: id, status: currentStatus === 'done' ? 'todo' : 'done' });
  };

  // Performance Data — match by email (AuthContext.email matches users.email in Supabase)
  const myPerformance = statsData?.employeePerformance.find(p => p.email === user?.email)
                        ?? statsData?.employeePerformance[0];
  
  const target = myPerformance?.targetMonthly || 200000000;
  const actual = myPerformance?.actualRevenue || 0;
  const pct = Math.min((actual / target) * 100, 100);
  const remainingTarget = Math.max(target - actual, 0);
  
  // Days remaining in month
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = lastDay.getDate() - now.getDate();

  // Deals grouped by stage
  const dealsByStage = Object.entries(
    deals.reduce((acc, deal) => {
      if (!acc[deal.stage]) acc[deal.stage] = [];
      acc[deal.stage].push(deal);
      return acc;
    }, {} as Record<string, typeof deals>)
  ).map(([stage, dealsInStage]) => ({
    id: stage,
    ...dealStages[stage] || dealStages['lead'],
    deals: dealsInStage,
  }));

  // Map Upcoming Tasks to Events
  const upcomingTasks = tasks
    .filter(t => t.due_date && daysDiff(t.due_date) >= 0 && daysDiff(t.due_date) <= 7 && t.status !== 'done')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)' }}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ color: 'var(--foreground)', fontSize: 22, fontWeight: 600 }}>
          Xin chào, {user?.name || 'Bạn'} 👋
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 3 }}>
          {WEEK_DAYS[now.getDay()]}, {now.toLocaleDateString('vi-VN')}
        </p>
      </div>

      {/* ── ROW 1: Target progress (full width) ─────────────────────────────── */}
      <div
        className="rounded-xl px-8 py-6"
        style={{
          background: 'linear-gradient(135deg, #1A4F9C 0%, #0e3470 60%, #0b2554 100%)',
          boxShadow: '0 4px 20px rgba(26,79,156,0.35)',
        }}
      >
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <p className="text-white/70" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              Target tháng {now.getMonth() + 1}
            </p>
            <p className="text-white mt-0.5" style={{ fontSize: 22, fontWeight: 700 }}>
              {target.toLocaleString('vi-VN')} ₫
            </p>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80" style={{ fontSize: 'var(--text-sm)' }}>
                  Tiến độ hoàn thành
                </span>
                <span className="text-white" style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.18)' }}>
                <div
                  className="h-full rounded-full relative overflow-hidden transition-all duration-1000"
                  style={{ width: `${pct}%`, backgroundColor: '#34d399' }}
                >
                  <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' }} />
                </div>
              </div>
              <div className="flex items-center gap-8 mt-3">
                <div>
                  <span className="text-white/60" style={{ fontSize: 'var(--text-xs)' }}>Đã đạt</span>
                  <p className="text-white" style={{ fontWeight: 700, fontSize: 15, marginTop: 1 }}>
                    {actual.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div>
                  <span className="text-white/60" style={{ fontSize: 'var(--text-xs)' }}>Còn lại</span>
                  <p className="text-white" style={{ fontWeight: 700, fontSize: 15, marginTop: 1 }}>
                     {remainingTarget.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl px-5 py-4 flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)', minWidth: 200 }}>
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

      {/* ── ROW 2: Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5">
        
        {/* Card 1: Tin nhắn chờ / SLA Alert */}
        <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>Cảnh báo SLA hôm nay</p>
              <p style={{ color: '#991F1F', fontSize: 44, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>
                {statsData?.alerts.slaViolations || 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
              <AlertCircle size={22} strokeWidth={1.5} style={{ color: '#991F1F' }} />
            </div>
          </div>
          <button className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#991F1F', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Xem chi tiết vi phạm <ChevronRight size={13} strokeWidth={2} />
          </button>
        </div>

        {/* Card 2: Task hôm nay */}
        <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>Task hôm nay</p>
            <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#1A4F9C', fontSize: 10, fontWeight: 600 }}>
              {doneCount}/{totalCount} xong
            </span>
          </div>
          <DonutChart done={doneCount} total={totalCount} />
          <div className="mt-4 pt-4 space-y-1 block" style={{ borderTop: '1px solid var(--border)' }}>
            {todayTasks.filter(t => t.status !== 'done').slice(0, 2).map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1">
                <button onClick={() => toggleTask(t.id, t.status)}>
                  <Square size={14} strokeWidth={1.5} style={{ color: '#cbd5e1' }} />
                </button>
                <span className="truncate" style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)', flex: 1 }}>
                  {t.title}
                </span>
                <PriorityBadge p={t.priority} />
              </div>
            ))}
            {todayTasks.filter(t => t.status !== 'done').length === 0 && (
               <div className="text-center text-sm text-gray-500 py-1">Đã hoàn thành tất cả task hôm nay!</div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 3: Deals + Tasks/Calendar ──────────────────────────────────── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* LEFT: Deals mini kanban */}
        <div className="rounded-lg overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div>
              <h2 style={{ color: 'var(--foreground)', fontSize: 'var(--text-lg)' }}>Deals của tôi</h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 2 }}>
                {deals.length} deals đang mở
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              ⚠ {deals.filter(d => daysDiff(d.expected_close_date) <= 7).length} sắp đến hạn
            </span>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {dealsByStage.map((stage) => (
              <div key={stage.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: stage.bg, color: stage.color, fontSize: 11, fontWeight: 600 }}>
                    {stage.label}
                  </span>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-xs)' }}>
                    {stage.deals.length} deals
                  </span>
                </div>
                <div className="space-y-2 pl-1">
                  {stage.deals.map((deal) => {
                    const diff = daysDiff(deal.expected_close_date);
                    const urgent = diff <= 7;
                    return (
                      <div key={deal.id} className="rounded-lg px-3.5 py-3 flex items-start justify-between gap-3 cursor-pointer hover:shadow-sm transition-shadow" style={{ backgroundColor: urgent ? '#fff9f9' : '#f8fafc', border: `1px solid ${urgent ? '#fecaca' : '#e2e8f0'}` }}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate" style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                            {deal.title}
                          </p>
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
                        <div className="flex-shrink-0 text-right">
                          <span style={{ color: '#1A4F9C', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                            {(deal.value / 1000000).toFixed(0)}tr ₫
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {deals.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-4">Chưa có deal nào.</div>
            )}
          </div>
        </div>

        {/* RIGHT: Task list + Mini week calendar */}
        <div className="flex flex-col gap-5 h-[500px]">
          
          <div className="rounded-lg overflow-hidden flex flex-col h-1/2" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
              <h2 style={{ color: 'var(--foreground)', fontSize: 'var(--text-lg)' }}>Tất cả Nhiệm vụ</h2>
            </div>
            <div className="divide-y overflow-y-auto flex-1" style={{ borderColor: 'var(--border)' }}>
              {tasks.map((task) => {
                const done = task.status === 'done';
                const diff = daysDiff(task.due_date);
                return (
                  <div key={task.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleTask(task.id, task.status)}>
                    {done ? (
                      <CheckCircle2 size={17} strokeWidth={1.5} style={{ color: '#0E7C6B', flexShrink: 0 }} />
                    ) : (
                      <Circle size={17} strokeWidth={1.5} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                    )}
                    <span className="flex-1 truncate" style={{ color: done ? 'var(--muted-foreground)' : 'var(--foreground)', fontSize: 'var(--text-sm)', textDecoration: done ? 'line-through' : 'none' }}>
                      {task.title}
                    </span>
                    <PriorityBadge p={task.priority} />
                    <span style={{ color: diff < 0 && !done ? '#991F1F' : diff === 0 && !done ? '#B85C00' : 'var(--muted-foreground)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap', fontWeight: diff <= 0 && !done ? 600 : 400 }}>
                      {diff < 0 && !done ? `Quá hạn ${Math.abs(diff)}n` : diff === 0 && !done ? 'Hôm nay' : formatDate(task.due_date)}
                    </span>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-4">Không có nhiệm vụ nào.</div>
              )}
            </div>
          </div>

          <div className="rounded-lg overflow-hidden flex flex-col h-1/2" style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              <h2 style={{ color: 'var(--foreground)', fontSize: 'var(--text-lg)' }}>Tiến độ 7 ngày tới</h2>
            </div>
            <div className="px-5 py-3 shrink-0">
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((date, i) => {
                  const isToday = date.toDateString() === TODAY.toDateString();
                  const hasEvent = upcomingTasks.some((e) => e.due_date && new Date(e.due_date).toDateString() === date.toDateString());
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{WEEK_DAYS[date.getDay()]}</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center relative" style={{ backgroundColor: isToday ? '#1A4F9C' : 'transparent' }}>
                        <span style={{ color: isToday ? '#fff' : 'var(--foreground)', fontSize: 'var(--text-sm)', fontWeight: isToday ? 700 : 400 }}>
                          {date.getDate()}
                        </span>
                        {hasEvent && !isToday && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-5 pb-4 pt-2 space-y-2 flex-1 overflow-y-auto" style={{ borderTop: '1px solid var(--border)' }}>
              {upcomingTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: '#1A4F9C', minHeight: 28 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--foreground)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{t.title}</p>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-xs)', marginTop: 1 }}>{formatDate(t.due_date)}</p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                    +{daysDiff(t.due_date)} ngày
                  </span>
                </div>
              ))}
              {upcomingTasks.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-2">Trống lịch</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
