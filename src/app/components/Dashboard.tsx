import { Users, AlertTriangle, TrendingUp, Handshake, DollarSign, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';
import { StatCard } from './StatCard';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useTasks } from '../../hooks/useTasks';
import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { tasks, isLoading: isLoadingTasks, updateStatus } = useTasks();

  const isLoading = isLoadingStats || isLoadingTasks;

  const toggleTask = (id: string, currentStatus: string) => {
    updateStatus({ taskId: id, status: currentStatus === 'done' ? 'todo' : 'done' });
  };

  const tasksOverview = useMemo(() => {
    return tasks.slice(0, 10).map((t) => ({
      ...t,
      isLate: t.due_date && new Date(t.due_date).getTime() < new Date().getTime() && t.status !== 'done',
    }));
  }, [tasks]);

  if (isLoading) {
    return <div className="p-6">Đang tải Tổng quan...</div>;
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          Tổng quan Dự án
        </h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>
          {new Date().toLocaleDateString('vi-VN')} • Dữ liệu Realtime
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Doanh thu tháng (VNĐ)"
          value={stats.kpi.monthlyRevenue.toLocaleString('vi-VN')}
          change="Doanh thu tạm tính"
          changeType="positive"
          icon={DollarSign}
          iconBg="var(--primary)"
        />
        <StatCard
          title="Deals mới tuần này"
          value={stats.kpi.newDealsWeek.toString()}
          change={`Tỷ lệ chốt: ${stats.kpi.closingRate.toFixed(1)}%`}
          changeType="positive"
          icon={Handshake}
          iconBg="var(--accent)"
        />
        <StatCard
          title="Tất cả Tasks"
          value={tasks.length.toString()}
          change={`${tasks.filter(t => t.status === 'done').length} đã hoàn thành`}
          changeType="neutral"
          icon={Users}
          iconBg="var(--accent)"
        />
        <StatCard
          title="Cảnh báo SLA hôm nay"
          value={stats.alerts.slaViolations.toString()}
          change={stats.alerts.slaViolations > 0 ? "Cần xử lý khẩn" : "Tốt"}
          changeType={stats.alerts.slaViolations > 0 ? "negative" : "neutral"}
          icon={AlertTriangle}
          iconBg={stats.alerts.slaViolations > 0 ? "var(--warning)" : "var(--primary)"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Doanh thu 12 tháng */}
        <div className="lg:col-span-2 rounded-lg p-6 bg-white shadow-sm border border-slate-100">
           <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Doanh thu 12 tháng gần nhất</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium">
                 <TrendingUp size={16} /> Update Realtime
              </div>
           </div>
           
           <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={stats.revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis 
                       axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }}
                       tickFormatter={(v) => (v / 1000000).toFixed(0) + 'M'}
                    />
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                       formatter={(val: number) => [val.toLocaleString('vi-VN') + ' ₫', 'Doanh thu']}
                    />
                    <Bar dataKey="revenue" fill="#1A4F9C" radius={[4, 4, 0, 0]} barSize={24} />
                    <Line type="monotone" dataKey="revenue" stroke="#B85C00" strokeWidth={3} dot={{ r: 4, fill: '#B85C00', strokeWidth: 2, stroke: '#fff' }} />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Cập nhật / Tasks */}
        <div className="rounded-lg bg-white shadow-sm border border-slate-100 flex flex-col h-[400px]">
           <div className="px-6 py-4 border-b border-slate-100 shrink-0">
             <h2 className="text-lg font-semibold text-slate-800">Tasks mới nhất</h2>
             <p className="text-xs text-slate-500 mt-1">Trực tiếp từ Supabase</p>
           </div>
           <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
             {tasksOverview.map((task) => {
               const done = task.status === 'done';
               return (
                 <div key={task.id} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleTask(task.id, task.status)}>
                   <div className="mt-0.5">
                     {done ? <CheckCircle2 size={18} className="text-green-600" /> : <Circle size={18} className="text-slate-300" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className={`text-sm font-medium truncate ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                       {task.title}
                     </p>
                     <div className="mt-1 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={12} /> {new Date(task.created_at).toLocaleDateString()}
                        </span>
                        {task.isLate && !done && (
                           <span className="text-red-500 font-semibold flex items-center gap-1">
                             <AlertTriangle size={12} /> Trễ hạn
                           </span>
                        )}
                        {!task.isLate && !done && task.due_date && (
                           <span className="text-blue-600 font-semibold flex items-center gap-1">
                             <Calendar size={12} /> Tới hạn: {new Date(task.due_date).toLocaleDateString()}
                           </span>
                        )}
                     </div>
                   </div>
                 </div>
               );
             })}
             {tasksOverview.length === 0 && (
                <div className="text-center p-8 text-slate-500">Không có task nào.</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
