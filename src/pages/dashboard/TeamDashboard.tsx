import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Cell
} from 'recharts';
import {
  Download, Calendar, Target,
  MessageCircle, AlertTriangle, ChevronRight,
  LineChart as LineChartIcon, Handshake,
  Users, DollarSign, PieChart, Activity
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../app/components/ui/table';
import { Progress } from '../../app/components/ui/progress';
import { Badge } from '../../app/components/ui/badge';
import { Skeleton } from '../../app/components/ui/skeleton';

// Helper formatters
const formatCurrency = (value: number) => {
  return value.toLocaleString('vi-VN') + ' ₫';
};

const STAGE_COLORS: Record<string, string> = {
  'Lead': '#94a3b8',
  'Tư vấn': '#60a5fa',
  'Gửi báo giá': '#3b82f6',
  'Đàm phán': '#2563eb',
  'Chốt HĐ': '#1A4F9C',
  'Đang TN': '#0E7C6B',
  'Hoàn thành': '#059669',
};

export default function TeamDashboard() {
  const { data, isLoading, isError, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Đã xảy ra lỗi khi tải dữ liệu</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { kpi, revenueChart, pipelineFunnel, employeePerformance, alerts } = data;

  return (
    <div className="flex flex-col min-h-screen bg-background/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Đội ngũ</h1>
          <p className="text-muted-foreground">Tổng quan hiệu suất kinh doanh PGL</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-white shadow-sm gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <span>Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
          </Badge>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
            <Download size={16} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Doanh thu tháng" 
          value={formatCurrency(kpi.monthlyRevenue)} 
          icon={<DollarSign className="w-5 h-5" />}
          trend="+12% so với tháng trước"
          type="primary"
        />
        <KPICard 
          title="Deals mới tuần này" 
          value={kpi.newDealsWeek.toString()} 
          unit="deals"
          icon={<Handshake className="w-5 h-5" />}
          trend="+3 deals mới"
          type="blue"
        />
        <KPICard 
          title="Tỷ lệ chốt" 
          value={kpi.closingRate.toFixed(1) + '%'} 
          icon={<Target className="w-5 h-5" />}
          trend="Mục tiêu: 70%"
          type="orange"
        />
        <KPICard 
          title="Nhóm Zalo hoạt động" 
          value={kpi.activeZaloGroups.toString()} 
          unit="nhóm"
          icon={<MessageCircle className="w-5 h-5" />}
          trend="Realtime analytics"
          type="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue 12 Months */}
        <Card className="lg:col-span-2 shadow-sm border-none bg-white rounded-xl overflow-hidden mt-2">
          <CardHeader className="pb-2 border-b border-sidebar-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-primary" />
                Biểu đồ doanh thu 12 tháng
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A4F9C" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#1A4F9C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(v) => (v / 1000000).toFixed(0) + 'M'}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#1A4F9C" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Xu hướng" 
                    stroke="#B85C00" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#B85C00', strokeWidth: 2, stroke: '#fff' }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Funnel */}
        <Card className="shadow-sm border-none bg-white rounded-xl overflow-hidden mt-2">
          <CardHeader className="pb-2 border-b border-sidebar-border/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Pipeline Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="stage" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                    width={90}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(val: number) => [formatCurrency(val), 'Giá trị']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={25}>
                    {pipelineFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between px-2">
               <div className="text-center">
                  <p className="text-xs text-muted-foreground">Tổng Lead</p>
                  <p className="font-bold text-primary">{pipelineFunnel[0]?.count || 0}</p>
               </div>
               <div className="h-8 w-[1px] bg-slate-200"></div>
               <div className="text-center">
                  <p className="text-xs text-muted-foreground">Hợp đồng</p>
                  <p className="font-bold text-green-600">{pipelineFunnel[6]?.count || 0}</p>
               </div>
               <div className="h-8 w-[1px] bg-slate-200"></div>
               <div className="text-center">
                  <p className="text-xs text-muted-foreground">Tỷ lệ HT</p>
                  <p className="font-bold text-orange-600">
                    {pipelineFunnel[0]?.count > 0 ? ((pipelineFunnel[6]?.count / pipelineFunnel[0]?.count) * 100).toFixed(1) : 0}%
                  </p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card className="shadow-sm border-none bg-white rounded-xl overflow-hidden mt-2">
        <CardHeader className="pb-4 border-b border-sidebar-border/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Hiệu suất nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Nhân viên</TableHead>
                <TableHead className="font-semibold text-slate-700">Target (VNĐ)</TableHead>
                <TableHead className="font-semibold text-slate-700">Thực tế (VNĐ)</TableHead>
                <TableHead className="font-semibold text-slate-700 w-[200px]">% Hoàn thành</TableHead>
                <TableHead className="font-semibold text-slate-700">Deals</TableHead>
                <TableHead className="font-semibold text-slate-700">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeePerformance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu hiệu suất
                  </TableCell>
                </TableRow>
              ) : (
                employeePerformance.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{formatCurrency(emp.targetMonthly)}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatCurrency(emp.actualRevenue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={emp.completionRate} className="h-2 flex-1" />
                        <span className="text-xs font-bold min-w-[35px]">{Math.round(emp.completionRate)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{emp.dealsCount}</TableCell>
                    <TableCell>
                      <Badge variant={emp.winRate > 50 ? 'secondary' : 'outline'} className={emp.winRate > 50 ? 'bg-green-100 text-green-700 border-none' : ''}>
                        {emp.winRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Banner */}
      <div className="bg-red-600 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl border border-red-500/20 mt-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full animate-pulse">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="text-white">
            <p className="font-bold text-lg">Cảnh báo quan trọng!</p>
            <p className="text-red-50 text-sm opacity-90">
              {alerts.slaViolations} SLA vi phạm hôm nay — {alerts.expiringContracts} hợp đồng cần gia hạn trong 30 ngày tới.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-all font-bold group">
          Xử lý ngay
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Debug Log */}
      <div className="text-[10px] text-muted-foreground opacity-30 mt-8 text-right italic font-mono">
         Last synced: {new Date().toLocaleTimeString('vi-VN')} | Connected to Supabase Production
      </div>
    </div>
  );
}

// Sub-component for KPI Cards
function KPICard({ title, value, unit, icon, trend, type }: { 
  title: string; value: string; unit?: string; icon: React.ReactNode; trend: string; type: 'primary' | 'blue' | 'green' | 'orange' 
}) {
  const bgColors = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Card className="border-none shadow-sm bg-white rounded-xl hover:shadow-md transition-all group overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
              {unit && <span className="text-xs text-muted-foreground font-normal">{unit}</span>}
            </div>
          </div>
          <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${bgColors[type]}`}>
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          <Activity size={12} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-medium">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}
