import { useState, ReactNode } from 'react';
import {
  Building2, Search,
  ChevronLeft, ChevronRight,
  Plus, Edit2, Trash2
} from 'lucide-react';
import { useCustomers, useUsersList, Customer } from '../../hooks/useCustomers';
import { Card, CardContent } from '../../app/components/ui/card';
import { Input } from '../../app/components/ui/input';
import { Button } from '../../app/components/ui/button';
import { Badge } from '../../app/components/ui/badge';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '../../app/components/ui/select';
import { ComponentLoading } from '../../app/components/ComponentLoading';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '../../app/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '../../app/components/ui/dialog';
import { AddCustomerDialog } from './AddCustomerDialog';
import { EditCustomerDialog } from './EditCustomerDialog';

interface CustomerListProps {
  onCustomerSelect: (id: string) => void;
}

export default function CustomerList({ onCustomerSelect }: CustomerListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    tier: 'all',
    assigned_to: 'all',
    search: '',
  });

  const { customers, totalCount, isLoading, isError, error, deleteCustomer } = useCustomers(filters, page);
  const { data: users } = useUsersList();

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setIsEditOpen(true);
  };

  const confirmDelete = () => {
    if (deleteCustomerId) {
      deleteCustomer(deleteCustomerId);
      setDeleteCustomerId(null);
    }
  };

  // ── Badge helpers ──────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const map: Record<string, ReactNode> = {
      active: <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Hoạt động</Badge>,
      inactive: <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Ngừng</Badge>,
      blacklist: <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Blacklist</Badge>,
    };
    return map[status] ?? <Badge variant="outline">{status}</Badge>;
  };

  // Enum DB: standard / silver / gold / vip
  const getTierBadge = (tier: string) => {
    const map: Record<string, ReactNode> = {
      vip: <Badge className="bg-[#6C3BAA] text-white hover:bg-[#6C3BAA]/90">VIP</Badge>,
      gold: <Badge className="bg-amber-500 text-white">Gold</Badge>,
      silver: <Badge className="bg-slate-400 text-white">Silver</Badge>,
      standard: <Badge variant="outline">Standard</Badge>,
    };
    return map[tier] ?? <Badge variant="outline">{tier}</Badge>;
  };

  const getZaloBadge = (zaloStatus: string) => {
    const map: Record<string, ReactNode> = {
      active: <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>,
      silent_30: <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">30 ngày</Badge>,
      silent_90: <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">90 ngày</Badge>,
      silent_180: <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">180 ngày</Badge>,
    };
    return map[zaloStatus] ?? null;
  };

  const pageSize = 20;
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Lỗi tải dữ liệu: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách khách hàng</h1>
          <p className="text-slate-500 text-sm">
            {isLoading ? 'Đang tải...' : `${totalCount} khách hàng`}
          </p>
        </div>
        <Button className="font-bold flex items-center gap-2" onClick={() => setIsAddOpen(true)}>
          <Plus size={18} /> Thêm khách hàng
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Tìm theo tên công ty..."
              className="pl-9"
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value, })}
            />
          </div>

          <Select value={filters.status} onValueChange={val => setFilters({ ...filters, status: val })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Ngừng</SelectItem>
              <SelectItem value="blacklist">Blacklist</SelectItem>
            </SelectContent>
          </Select>

          {/* Tier filter khớp đúng enum DB */}
          <Select value={filters.tier} onValueChange={val => setFilters({ ...filters, tier: val })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Phân hạng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi hạng</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter nhân viên theo email (assigned_to lưu email) */}
          <Select value={filters.assigned_to} onValueChange={val => setFilters({ ...filters, assigned_to: val })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Người phụ trách" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhân viên</SelectItem>
              {users?.map(u => (
                <SelectItem key={u.id} value={u.email}> {/* ← dùng email, không phải id */}
                  {u.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            className="text-slate-500 text-xs"
            onClick={() => { setFilters({ status: 'all', tier: 'all', assigned_to: 'all', search: '' }); setPage(1); }}
          >
            Xóa bộ lọc
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold">Công ty</TableHead>
                <TableHead className="font-bold">Hạng</TableHead>
                <TableHead className="font-bold">Trạng thái</TableHead>
                <TableHead className="font-bold">Zalo</TableHead>
                <TableHead className="font-bold">Phụ trách</TableHead>
                <TableHead className="font-bold">Số Deal</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <ComponentLoading message="Đang tải danh sách khách hàng..." size="lg" />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                    Không tìm thấy khách hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                customers.map(c => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors group"
                    onClick={() => onCustomerSelect(c.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                            {c.company_name}
                          </p>
                          {c.short_name && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{c.short_name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTierBadge(c.tier)}</TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell>{getZaloBadge(c.zalo_status || 'none')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 uppercase">
                          {c.sales_name?.charAt(0) ?? '?'}
                        </div>
                        <span className="text-sm text-slate-600">{c.sales_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold">{c.deal_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          onClick={e => { e.stopPropagation(); handleEdit(c); }}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors"
                          onClick={e => { e.stopPropagation(); setDeleteCustomerId(c.id); }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t bg-white flex items-center justify-between">
          <p className="text-xs text-slate-500 italic">
            {totalCount > 0
              ? `Hiển thị ${from}–${to} của ${totalCount} khách hàng`
              : 'Không có dữ liệu'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={to >= totalCount || isLoading}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
      
      <AddCustomerDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <EditCustomerDialog open={isEditOpen} onOpenChange={setIsEditOpen} customer={editingCustomer} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteCustomerId} onOpenChange={(open) => !open && setDeleteCustomerId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription className="py-2">
              Bạn có chắc chắn muốn xóa khách hàng này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCustomerId(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Xóa khách hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}