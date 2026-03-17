import React, { useState, useEffect } from 'react';
import { 
  Timer, AlertCircle, CheckCircle2, 
  History, MessageSquare, 
  UserCheck, ArrowRight, Wallet,
  ShieldAlert, Activity
} from 'lucide-react';
import { useSLAData } from '../../hooks/useSLAData';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../app/components/ui/table';
import { Badge } from '../../app/components/ui/badge';
import { Skeleton } from '../../app/components/ui/skeleton';
import { Button } from '../../app/components/ui/button';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';

const formatVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export default function SLAMonitor() {
  const { 
    unrespondedMessages, 
    isLoading, 
    isError, 
    error, 
    stats, 
    history, 
    processMessage, 
    isProcessing 
  } = useSLAData();

  // State to force refresh waiting times UI every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000); // 30s refresh
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Lỗi tải dữ liệu SLA</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  const getSLAStatus = (createdAt: string) => {
    const minutes = differenceInMinutes(new Date(), parseISO(createdAt));
    if (minutes < 15) return { label: `${minutes}p`, color: 'bg-green-100 text-green-700 border-green-200', minutes };
    if (minutes < 30) return { label: `${minutes}p`, color: 'bg-orange-100 text-orange-700 border-orange-200', minutes };
    return { label: `QUÁ HẠN (${minutes}p)`, color: 'bg-red-100 text-red-700 border-red-200 animate-pulse', minutes };
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SLA Monitor</h1>
          <p className="text-slate-500">Giám sát thời gian phản hồi khách hàng (Mục tiêu: 30 phút)</p>
        </div>
        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2 border border-blue-100 italic text-sm">
          <Activity size={16} className="animate-spin-slow" />
          Dữ liệu đang được cập nhật realtime...
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Chờ phản hồi" 
          value={stats?.waitingCount.toString() || '0'} 
          icon={<Timer className="text-blue-600" />} 
          desc="Tin nhắn chưa xử lý"
        />
        <StatCard 
          title="Vi phạm hôm nay" 
          value={stats?.violationsToday.toString() || '0'} 
          icon={<AlertCircle className="text-red-600" />} 
          desc="Vượt ngưỡng 30 phút"
        />
        <StatCard 
          title="Phản hồi TB" 
          value={(stats?.avgResponseTime.toFixed(1) || '0') + 'p'} 
          icon={<UserCheck className="text-green-600" />} 
          desc="Hôm nay"
        />
        <StatCard 
          title="Tỷ lệ đúng SLA" 
          value={(stats?.slaComplianceRate.toFixed(1) || '100') + '%'} 
          icon={<CheckCircle2 className="text-indigo-600" />} 
          desc="Chất lượng phục vụ"
        />
      </div>

      {/* Main Content: Waiting Table */}
      <Card className="shadow-sm border-none bg-white rounded-xl overflow-hidden mt-2">
        <CardHeader className="bg-slate-50/50 pb-4 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Tin nhắn chờ phản hồi (Realtime)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[200px]">Khách hàng</TableHead>
                <TableHead>Nội dung tin nhắn</TableHead>
                <TableHead>Người phụ trách</TableHead>
                <TableHead>Thời điểm nhận</TableHead>
                <TableHead>Thời gian chờ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unrespondedMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" />
                    Hiện không có tin nhắn nào đang chờ phản hồi. Tuyệt vời!
                  </TableCell>
                </TableRow>
              ) : (
                unrespondedMessages.map((msg) => {
                  const sla = getSLAStatus(msg.activity_at);
                  return (
                    <TableRow key={msg.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        {msg.customer?.company_name || 'Khách hàng ẩn danh'}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate italic text-slate-600">
                        "{msg.content}"
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                            {msg.user?.full_name?.charAt(0)}
                          </div>
                          <span className="text-sm">{msg.user?.full_name || 'Chưa gán'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {format(parseISO(msg.activity_at), 'HH:mm (dd/MM)', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${sla.color} font-bold px-2 py-1`}>
                          {sla.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="hover:bg-blue-600 hover:text-white transition-all gap-1 border-blue-200 text-blue-600"
                          onClick={() => processMessage(msg.id)}
                          disabled={isProcessing}
                        >
                          Xử lý <ArrowRight size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Violation History Table */}
      <Card className="shadow-sm border-none bg-white rounded-xl overflow-hidden mt-4">
        <CardHeader className="bg-slate-50/50 pb-4 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-red-600" />
            Lịch sử vi phạm (7 ngày gần nhất)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Thời gian</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Trễ (Phút)</TableHead>
                <TableHead className="text-right">Phạt dự kiến</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    Không có bản ghi vi phạm trong 7 ngày qua.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((h: any) => {
                  const penalty = Math.floor((h.response_time_minutes || 0) / 30) * 10000;
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm">
                        {format(parseISO(h.activity_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{h.user?.full_name}</TableCell>
                      <TableCell className="text-sm text-slate-600">{h.customer?.company_name}</TableCell>
                      <TableCell>
                        <span className="text-red-600 font-bold">{h.response_time_minutes}p</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200 flex items-center gap-1 justify-end ml-auto w-fit">
                          <Wallet size={12} />
                          {formatVND(penalty)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rules Notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-bold">Quy tắc PGL (Nhóm I):</p>
          <ul className="list-disc list-inside mt-1 space-y-1 opacity-90">
            <li>Tất cả yêu cầu phải được phản hồi trong vòng 30 phút.</li>
            <li>Trễ mỗi 30 phút phạt 10.000 ₫ (làm tròn xuống).</li>
            <li>Leader có trách nhiệm đôn đốc nhân viên khi tin nhắn quá 15 phút chưa xử lý.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, desc }: { title: string, value: string, icon: React.ReactNode, desc: string }) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            {icon}
          </div>
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-3 flex items-center gap-1">
          <CheckCircle2 size={10} />
          {desc}
        </p>
      </CardContent>
    </Card>
  );
}
