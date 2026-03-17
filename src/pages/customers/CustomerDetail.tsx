import { useState, FormEvent, ReactNode } from 'react';
import {
  Building2, Phone, Mail,
  ArrowLeft, FileText, ClipboardList, ShieldAlert,
  DollarSign, Target, User as UserIcon, Zap
} from 'lucide-react';
import { useCustomerDetail } from '../../hooks/useCustomers';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../app/components/ui/tabs';
import { Badge } from '../../app/components/ui/badge';
import { ComponentLoading } from '../../app/components/ComponentLoading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../app/components/ui/table';
import { Textarea } from '../../app/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CustomerDetailProps {
  id: string;
  onBack: () => void;
}

const formatVND = (n: number) =>
  n.toLocaleString('vi-VN') + ' ₫';

// ── Badge tier khớp đúng enum DB: standard/silver/gold/vip ──
const TIER_STYLE: Record<string, string> = {
  vip: 'bg-[#6C3BAA] text-white hover:bg-[#6C3BAA]/90',
  gold: 'bg-amber-500 text-white',
  silver: 'bg-slate-400 text-white',
  standard: 'bg-slate-100 text-slate-600',
};

// ── Label tiếng Việt cho loại hoạt động ──
const ACTIVITY_LABEL: Record<string, string> = {
  zalo: 'Zalo',
  call: 'Gọi điện',
  email: 'Email',
  meeting: 'Gặp mặt',
  note: 'Ghi chú',
  payment: 'Thanh toán',
  stage_change: 'Chuyển giai đoạn',
  sla_violation: 'Vi phạm SLA',
};

// ── Label thanh toán ──
const PAYMENT_LABEL: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  partial_50: 'Tạm ứng 50%',
  paid_full: 'Đã thanh toán',
  overdue: 'Quá hạn',
};

export default function CustomerDetail({ id, onBack }: CustomerDetailProps) {
  const {
    customer, activities, orders, quotes, contracts,
    isLoading, isError, error,
    addActivity, updateStatus, isMutating,
  } = useCustomerDetail(id);

  const [newActivity, setNewActivity] = useState({ content: '', type: 'note' });

  const handleAddActivity = (e: FormEvent) => {
    e.preventDefault();
    if (!newActivity.content.trim()) return;
    addActivity({
      type: newActivity.type,
      content: newActivity.content,
      activity_date: new Date().toISOString(), // ← đúng tên cột DB
    });
    setNewActivity({ content: '', type: 'note' });
  };

  const handleBlacklist = () => {
    const reason = window.prompt('Lý do đưa vào danh sách đen:');
    if (reason !== null) updateStatus({ status: 'blacklist', reason });
  };

  if (isLoading) return <ComponentLoading />;
  if (isError) return <div className="p-8 text-center text-red-500">Lỗi: {(error as Error).message}</div>;
  if (!customer) return <div className="p-8 text-center text-slate-400">Không tìm thấy khách hàng</div>;

  const tierLabel = customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{customer.company_name}</h1>
                <Badge className={TIER_STYLE[customer.tier] ?? 'bg-slate-100 text-slate-600'}>
                  {tierLabel}
                </Badge>
                {customer.status === 'blacklist' && (
                  <Badge variant="destructive">BLACKLISTED</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 flex-wrap">
                {/* ← dùng sales_name đã được resolve trong hook, không dùng customer.sales?.full_name */}
                <span className="flex items-center gap-1">
                  <UserIcon size={14} /> {customer.sales_name || 'Chưa gán'}
                </span>
                {customer.industry && (
                  <span className="flex items-center gap-1">
                    <Zap size={14} /> {customer.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 font-bold"
              onClick={handleBlacklist}
            >
              <ShieldAlert size={16} className="mr-2" /> Blacklist
            </Button>
            <Button className="font-bold">Sửa thông tin</Button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sidebar */}
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            <KPICard
              title="Tổng đơn hàng"
              value={customer.kpis.totalOrders}
              icon={<ClipboardList className="text-blue-600" />}
            />
            <KPICard
              title="Tổng doanh thu"
              value={formatVND(customer.kpis.totalRevenue)}
              icon={<DollarSign className="text-green-600" />}
            />
            <KPICard
              title="Tỷ lệ thắng deal"
              value={`${customer.kpis.winRate}%`}
              icon={<Target className="text-purple-600" />}
            />
          </div>

          {/* Thông tin liên hệ */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ← bảng customers không có cột phone/email/contact_person trong schema
                     → hiển thị từ contacts nếu có, hoặc ẩn nếu null */}
              <InfoRow icon={<Phone size={16} />} label="Điện thoại" value={customer.phone ?? '—'} />
              <InfoRow icon={<Mail size={16} />} label="Email" value={customer.email ?? '—'} />
              <InfoRow icon={<UserIcon size={16} />} label="Phụ trách" value={customer.sales_name ?? 'Chưa gán'} />
              {customer.notes && (
                <InfoRow icon={<FileText size={16} />} label="Ghi chú" value={customer.notes} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-8">
              {[
                { value: 'timeline', label: 'Dòng thời gian' },
                { value: 'orders', label: 'Đơn hàng' },
                { value: 'quotes', label: 'Báo giá' },
                { value: 'contracts', label: 'Hợp đồng' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Tab Timeline ── */}
            <TabsContent value="timeline" className="pt-6 space-y-6">
              <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                  <form onSubmit={handleAddActivity} className="space-y-4">
                    <Textarea
                      placeholder="Nhập ghi chú hoặc hoạt động mới..."
                      className="min-h-[100px] border-slate-200 resize-none"
                      value={newActivity.content}
                      onChange={e => setNewActivity({ ...newActivity, content: e.target.value })}
                    />
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex gap-2 flex-wrap">
                        {(['note', 'call', 'meeting', 'zalo', 'email'] as const).map(t => (
                          <Badge
                            key={t}
                            variant={newActivity.type === t ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setNewActivity({ ...newActivity, type: t })}
                          >
                            {ACTIVITY_LABEL[t]}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        type="submit"
                        disabled={isMutating || !newActivity.content.trim()}
                        className="font-bold"
                      >
                        Lưu hoạt động
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Feed */}
              <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                {activities.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-sm italic">
                    Chưa có hoạt động nào
                  </p>
                ) : (
                  activities.map((act: any) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10">
                        <FileText size={10} className="text-primary" />
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                            {ACTIVITY_LABEL[act.type] ?? act.type}
                          </Badge>
                          <span className="text-[10px] text-slate-400 italic">
                            {/* ← dùng activity_date đúng tên cột DB */}
                            {act.activity_date
                              ? format(parseISO(act.activity_date), 'dd/MM/yyyy HH:mm', { locale: vi })
                              : '—'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{act.content}</p>
                        {act.performed_by && (
                          <p className="text-[11px] text-slate-400 mt-2">
                            — {act.performed_by}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* ── Tab Đơn hàng ── */}
            <TabsContent value="orders" className="pt-6">
              <TableEmpty data={orders} label="đơn hàng">
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Mã đơn</TableHead>
                        <TableHead className="font-bold">Ngày tạo</TableHead>
                        <TableHead className="font-bold">Giá trị</TableHead>
                        <TableHead className="font-bold">Bước</TableHead>
                        <TableHead className="font-bold">Thanh toán</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o: any) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium text-primary">
                            {o.order_code ?? o.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {format(parseISO(o.created_at), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatVND(o.total_value ?? 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Bước {o.current_step}/7</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                o.payment_status === 'paid_full' ? 'text-green-600 border-green-200' :
                                  o.payment_status === 'overdue' ? 'text-red-600 border-red-200' :
                                    o.payment_status === 'partial_50' ? 'text-yellow-600 border-yellow-200' :
                                      'text-slate-500'
                              }
                            >
                              {PAYMENT_LABEL[o.payment_status] ?? o.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TableEmpty>
            </TabsContent>

            {/* ── Tab Báo giá ── */}
            <TabsContent value="quotes" className="pt-6">
              <TableEmpty data={quotes} label="báo giá">
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Mã báo giá</TableHead>
                        <TableHead className="font-bold">Ngày tạo</TableHead>
                        <TableHead className="font-bold">Giá trị</TableHead>
                        <TableHead className="font-bold">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((q: any) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium text-primary">
                            {q.quotation_code ?? q.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {format(parseISO(q.created_at), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatVND(q.total_value ?? 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {q.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TableEmpty>
            </TabsContent>

            {/* ── Tab Hợp đồng ── */}
            <TabsContent value="contracts" className="pt-6">
              <TableEmpty data={contracts} label="hợp đồng">
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Mã HĐ</TableHead>
                        <TableHead className="font-bold">Ngày ký</TableHead>
                        <TableHead className="font-bold">Giá trị</TableHead>
                        <TableHead className="font-bold">Thanh toán</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-primary">
                            {c.contract_code ?? c.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {c.signed_at
                              ? format(parseISO(c.signed_at), 'dd/MM/yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatVND(c.total_value ?? 0)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                c.payment_status === 'paid_full' ? 'text-green-600 border-green-200' :
                                  c.payment_status === 'overdue' ? 'text-red-600 border-red-200' :
                                    'text-slate-500'
                              }
                            >
                              {PAYMENT_LABEL[c.payment_status] ?? c.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TableEmpty>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ── Components nhỏ ────────────────────────────────────────────

function KPICard({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{title}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function TableEmpty({ data, label, children }: { data: any[]; label: string; children: ReactNode }) {
  if (data.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300 text-slate-400">
        Chưa có {label} nào
      </div>
    );
  }
  return <>{children}</>;
}