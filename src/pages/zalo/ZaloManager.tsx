import { useState } from 'react';
import {
  MessageSquare, Plus, Search, Trash2, Send,
  Users, AlertCircle, BellOff, Clock,
} from 'lucide-react';
import { useZaloGroups, ZaloGroup } from '../../hooks/useZaloGroups';
import { ComponentLoading } from '../../app/components/ComponentLoading';
import { Input } from '../../app/components/ui/input';
import { Button } from '../../app/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../../app/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from '../../app/components/ui/dialog';

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active:     { label: 'Hoạt động',   color: '#0E7C6B', bg: '#f0fdf9', border: '#6ee7b7' },
  silent_30:  { label: 'Im 30 ngày',  color: '#B85C00', bg: '#fff7ed', border: '#fcd34d' },
  silent_90:  { label: 'Im 90 ngày',  color: '#991F1F', bg: '#fef2f2', border: '#fca5a5' },
  silent_180: { label: 'Im 180+ ngày',color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' },
};

// ─── ADD GROUP DIALOG ─────────────────────────────────────────────────────────

function AddGroupDialog({
  open,
  onOpenChange,
  customers,
  onCreate,
  isCreating,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customers: { id: string; company_name: string }[];
  onCreate: (payload: { customer_id: string; group_name: string }) => void;
  isCreating: boolean;
}) {
  const [customerId, setCustomerId] = useState('');
  const [groupName, setGroupName] = useState('');

  const handleSubmit = () => {
    if (!customerId || !groupName.trim()) return;
    onCreate({ customer_id: customerId, group_name: groupName.trim() });
    setCustomerId('');
    setGroupName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare size={18} className="text-green-600" />
            Thêm nhóm Zalo mới
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Khách hàng *</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn khách hàng..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tên nhóm Zalo *</label>
            <Input
              placeholder="VD: PG - Cty Gia Khang"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={isCreating || !customerId || !groupName.trim()}>
            {isCreating ? 'Đang thêm...' : 'Thêm nhóm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── LOG MESSAGE DIALOG ───────────────────────────────────────────────────────

function LogMessageDialog({
  group,
  open,
  onOpenChange,
  onLog,
  isLogging,
}: {
  group: ZaloGroup | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLog: (payload: { customer_id: string; content: string; customer_name?: string }) => void;
  isLogging: boolean;
}) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!group || !content.trim()) return;
    onLog({
      customer_id: group.customer_id,
      content: content.trim(),
      customer_name: group.customer?.company_name,
    });
    setContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send size={18} className="text-blue-600" />
            Ghi nhận tin nhắn Zalo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#f0fdf9', border: '1px solid #6ee7b7' }}>
            <p className="font-semibold text-slate-700">{group?.group_name || 'Chưa đặt tên'}</p>
            <p className="text-slate-500 text-xs mt-0.5">{group?.customer?.company_name}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nội dung tin nhắn nhận được *</label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none transition-all"
              placeholder="Nhập nội dung tin nhắn khách gửi..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <div className="rounded-lg px-4 py-3 text-xs text-blue-700" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <strong>SLA:</strong> Tin nhắn sẽ được gửi đến SLA Monitor. Timer 30 phút bắt đầu ngay khi bạn xác nhận.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={isLogging || !content.trim()}>
            {isLogging ? 'Đang ghi nhận...' : 'Xác nhận & bắt đầu SLA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── DELETE CONFIRM ───────────────────────────────────────────────────────────

function DeleteDialog({
  group,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  group: ZaloGroup | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 size={18} /> Xóa nhóm Zalo
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600 py-2">
          Bạn có chắc muốn xóa nhóm{' '}
          <span className="font-bold text-slate-900">"{group?.group_name}"</span> của{' '}
          <span className="font-bold text-slate-900">{group?.customer?.company_name}</span>?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Đang xóa...' : 'Xóa nhóm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ZaloManager() {
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loggingGroup, setLoggingGroup] = useState<ZaloGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ZaloGroup | null>(null);

  const {
    groups, isLoading, isError,
    customers, kpi,
    createGroup, isCreating,
    updateStatus,
    deleteGroup, isDeleting,
    logMessage, isLogging,
  } = useZaloGroups(filters.status === 'all' ? { search: filters.search } : filters);

  if (isLoading) return <ComponentLoading message="Đang tải danh sách nhóm Zalo..." />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <AlertCircle size={40} className="text-red-400 mb-3" />
        <p className="text-slate-600 font-semibold">Không thể tải dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare size={24} className="text-green-600" />
            Zalo Manager
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý nhóm Zalo & theo dõi SLA phản hồi</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2">
          <Plus size={16} /> Thêm nhóm
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Hoạt động',    value: kpi.active,     icon: Users,    color: '#0E7C6B', bg: '#f0fdf9', border: '#6ee7b7' },
          { label: 'Im 30 ngày',   value: kpi.silent_30,  icon: Clock,    color: '#B85C00', bg: '#fff7ed', border: '#fcd34d' },
          { label: 'Im 90 ngày',   value: kpi.silent_90,  icon: BellOff,  color: '#991F1F', bg: '#fef2f2', border: '#fca5a5' },
          { label: 'Im 180+ ngày', value: kpi.silent_180, icon: BellOff,  color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl px-5 py-4 flex items-center justify-between"
              style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: card.color }}>{card.label}</p>
                <p className="text-3xl font-black mt-1" style={{ color: card.color }}>{card.value}</p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}18` }}
              >
                <Icon size={20} style={{ color: card.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Tìm nhóm, khách hàng..."
            className="pl-10 bg-white border-slate-200"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="silent_30">Im lặng 30 ngày</SelectItem>
            <SelectItem value="silent_90">Im lặng 90 ngày</SelectItem>
            <SelectItem value="silent_180">Im lặng 180+ ngày</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-400 font-medium ml-1">{groups.length} nhóm</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Tên nhóm</th>
              <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Khách hàng</th>
              <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="text-right px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <MessageSquare size={36} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-semibold">Chưa có nhóm Zalo nào</p>
                  <p className="text-slate-400 text-xs mt-1">Bấm "Thêm nhóm" để bắt đầu</p>
                </td>
              </tr>
            ) : (
              groups.map(group => {
                const cfg = STATUS_CONFIG[group.status] || STATUS_CONFIG.active;
                const date = new Date(group.created_at);
                const dateStr = `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
                return (
                  <tr key={group.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Tên nhóm */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <MessageSquare size={13} className="text-green-600" />
                        </div>
                        <span className="font-semibold text-slate-800">{group.group_name || '(Chưa đặt tên)'}</span>
                      </div>
                    </td>
                    {/* Khách hàng */}
                    <td className="px-5 py-3.5 text-slate-600">
                      {group.customer?.company_name}
                    </td>
                    {/* Trạng thái */}
                    <td className="px-5 py-3.5">
                      <Select
                        value={group.status}
                        onValueChange={(val) =>
                          updateStatus({ id: group.id, status: val as ZaloGroup['status'] })
                        }
                      >
                        <SelectTrigger
                          className="h-7 text-[11px] font-bold border px-2.5 rounded-full w-auto"
                          style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    {/* Ngày tạo */}
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{dateStr}</td>
                    {/* Thao tác */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setLoggingGroup(group)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
                          style={{ backgroundColor: '#eff6ff', color: '#1A4F9C' }}
                          title="Ghi nhận tin nhắn mới"
                        >
                          <Send size={12} /> Ghi tin nhắn
                        </button>
                        <button
                          onClick={() => setDeletingGroup(group)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa nhóm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <AddGroupDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        customers={customers}
        onCreate={createGroup}
        isCreating={isCreating}
      />

      <LogMessageDialog
        group={loggingGroup}
        open={!!loggingGroup}
        onOpenChange={(open) => { if (!open) setLoggingGroup(null); }}
        onLog={logMessage}
        isLogging={isLogging}
      />

      <DeleteDialog
        group={deletingGroup}
        open={!!deletingGroup}
        onOpenChange={(open) => { if (!open) setDeletingGroup(null); }}
        onConfirm={() => {
          if (deletingGroup) {
            deleteGroup(deletingGroup.id, { onSuccess: () => setDeletingGroup(null) });
          }
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
}
