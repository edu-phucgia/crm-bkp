import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Search, TrendingUp, Calendar,
  Plus, Edit2, Trash2, GripVertical, AlertCircle
} from 'lucide-react';
import { usePipelineDeals, Deal } from '../../hooks/usePipelineDeals';
import { Card, CardContent } from '../../app/components/ui/card';
import { Badge } from '../../app/components/ui/badge';
import { ComponentLoading } from '../../app/components/ComponentLoading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import { Input } from '../../app/components/ui/input';
import { Button } from '../../app/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../app/components/ui/dialog';
import { differenceInDays, parseISO, format } from 'date-fns';
import { AddDealDialog } from './AddDealDialog';
import { EditDealDialog } from './EditDealDialog';

// ─── STAGES ───────────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'lead', label: 'Lead', color: '#94a3b8' },
  { id: 'tu_van', label: 'Tư vấn', color: '#60a5fa' },
  { id: 'gui_bao_gia', label: 'Gửi báo giá', color: '#3b82f6' },
  { id: 'dam_phan', label: 'Đàm phán', color: '#2563eb' },
  { id: 'chot_hd', label: 'Chốt HĐ', color: '#1A4F9C' },
  { id: 'dang_tn', label: 'Đang TN', color: '#0E7C6B' },
  { id: 'hoan_thanh', label: 'Hoàn thành', color: '#059669' },
];

const PRODUCT_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  'ict': { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  'qcvn_4': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  'pin_hsnl': { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  'qcvn_9': { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' },
  'qcvn_19': { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },
  'khac': { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

const PRODUCT_LABELS: Record<string, string> = {
  'ict': 'ICT',
  'qcvn_4': 'QCVN 4',
  'pin_hsnl': 'PIN/HSNL',
  'qcvn_9': 'QCVN 9',
  'qcvn_19': 'QCVN 19',
  'khac': 'Khác',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const formatVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

function getDaysInfo(expectedCloseDate: string | null) {
  if (!expectedCloseDate) return null;
  const days = differenceInDays(parseISO(expectedCloseDate), new Date());
  return days;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

interface ColumnProps {
  id: string;
  label: string;
  color: string;
  deals: Deal[];
  onAddDeal: (stage: string) => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (deal: Deal) => void;
}

function KanbanColumn({ id, label, color, deals, onAddDeal, onEditDeal, onDeleteDeal }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });
  const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-[280px] shrink-0 bg-slate-100 rounded-xl border border-slate-200"
    >
      <div
        className="px-4 py-3 rounded-t-xl border-b-2"
        style={{ borderColor: color, backgroundColor: '#fff' }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-700">{label}</span>
            <Badge variant="secondary" className="px-1.5 py-0 min-w-[20px] justify-center text-[10px] font-bold">
              {deals.length}
            </Badge>
          </div>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onAddDeal(id)}
            className="text-slate-400 hover:text-primary hover:bg-blue-50 rounded p-0.5 transition-colors"
            title="Thêm deal vào cột này"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="text-xs font-semibold text-primary">
          {formatVND(totalValue)}
        </div>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              onEdit={onEditDeal}
              onDelete={onDeleteDeal}
            />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-slate-300 rounded-lg">
            <p className="text-[10px] text-slate-400 font-medium">Kéo thả deal vào đây</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SortableCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

function SortableDealCard({ deal, onEdit, onDelete }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    // Tắt transition khi đang drag để không bị khựng
    transition: isDragging ? 'none' : transition,
    // Ẩn hoàn toàn source card — DragOverlay là bản hiển thị duy nhất
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? 'none' as const : undefined,
  };

  return (
    // Gắn listeners lên toàn bộ wrapper → drag được ở bất kỳ vị trí nào trên card
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <DealCard
        deal={deal}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

interface DealCardProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
  isOverlay?: boolean;
}

function DealCard({ deal, onEdit, onDelete, isOverlay }: DealCardProps) {
  const daysLeft = getDaysInfo(deal.expected_close_date);
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft < 7;
  const isWarning = daysLeft !== null && daysLeft >= 7 && daysLeft < 30;
  const productStyle = PRODUCT_COLORS[deal.product_type] || PRODUCT_COLORS['khac'];

  const borderColor = isOverdue || isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : 'transparent';

  const dateLabel = () => {
    if (!deal.expected_close_date) return <span className="text-slate-400">Chưa có ngày</span>;
    if (isOverdue) return <span className="text-red-500 font-bold">Quá hạn {Math.abs(daysLeft!)} ngày</span>;
    if (isUrgent) return <span className="text-red-500 font-bold">Còn {daysLeft} ngày</span>;
    if (isWarning) return <span className="text-amber-500 font-semibold">Còn {daysLeft} ngày</span>;
    return <span className="text-slate-400">{format(parseISO(deal.expected_close_date), 'dd/MM/yyyy')}</span>;
  };

  return (
    <Card
      className={`group relative transition-shadow border-l-4 ${isOverlay ? 'shadow-xl rotate-1' : 'hover:shadow-md'}`}
      style={{ borderLeftColor: borderColor }}
    >
      <CardContent className="p-0">
        {/* Drag handle — visual only, drag is handled by wrapper */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <GripVertical size={12} className="text-slate-300 shrink-0" />
          <p className="text-[11px] font-bold text-slate-900 line-clamp-1 flex-1">
            {deal.customer?.company_name}
          </p>
          {/* Action buttons — stop pointer propagation so they don't trigger drag */}
          {!isOverlay && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onEdit?.(deal)}
                className="p-1 hover:bg-blue-50 hover:text-blue-600 rounded text-slate-400 transition-colors cursor-pointer"
                title="Chỉnh sửa"
              >
                <Edit2 size={11} />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onDelete?.(deal)}
                className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition-colors cursor-pointer"
                title="Xóa deal"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        <div className="px-3 pb-3 space-y-2">
          <h4 className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-tight">
            {deal.title}
          </h4>

          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-primary">{formatVND(Number(deal.value))}</p>
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 border leading-none h-4"
              style={{ backgroundColor: productStyle.bg, color: productStyle.text, borderColor: productStyle.border }}
            >
              {PRODUCT_LABELS[deal.product_type] || 'Khác'}
            </Badge>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                {deal.owner?.full_name?.charAt(0) || '?'}
              </div>
              <span className="text-[9px] font-medium text-slate-500 line-clamp-1">
                {deal.owner?.full_name || 'Chưa phân công'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px]">
              {(isOverdue || isUrgent) && <AlertCircle size={9} className="text-red-500" />}
              <Calendar size={9} className={isOverdue || isUrgent ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-slate-400'} />
              {dateLabel()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── DELETE CONFIRMATION DIALOG ────────────────────────────────────────────────

function DeleteConfirmDialog({
  deal,
  open,
  onOpenChange,
  onConfirm,
  isDeleting
}: {
  deal: Deal | null;
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
            <Trash2 size={18} />
            Xóa Deal
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-slate-600">
          Bạn có chắc chắn muốn xóa deal{' '}
          <span className="font-bold text-slate-900">"{deal?.title}"</span> của khách hàng{' '}
          <span className="font-bold text-slate-900">{deal?.customer?.company_name}</span>?
          <p className="mt-2 text-xs text-slate-400">Deal sẽ được chuyển vào trạng thái "Đã mất" và ẩn khỏi pipeline.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Đang xóa...' : 'Xóa deal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Pipeline() {
  const [filters, setFilters] = useState<any>({ ownerId: 'all', productType: 'all', search: '' });
  const { deals, isLoading, isError, users, updateStage, deleteDeal, isDeleting } = usePipelineDeals(filters);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [addStage, setAddStage] = useState<string>('lead');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);

  const collisionDetection = useCallback((args: Parameters<typeof pointerWithin>[0]) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeDeal = deals.find(d => d.id === active.id);
    if (!activeDeal) return;

    const overId = over.id.toString();
    let newStage = '';

    if (STAGES.some(s => s.id === overId)) {
      newStage = overId;
    } else {
      const overDeal = deals.find(d => d.id === overId);
      if (overDeal) newStage = overDeal.stage;
    }

    if (newStage && newStage !== activeDeal.stage) {
      updateStage({
        dealId: activeDeal.id,
        newStage,
        oldStage: activeDeal.stage,
        customerId: activeDeal.customer_id
      });
    }
  };

  const handleAddDeal = (stage: string) => {
    setAddStage(stage);
    setIsAddOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingDeal) return;
    deleteDeal(deletingDeal.id, {
      onSuccess: () => setDeletingDeal(null)
    });
  };

  const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0);
  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  if (isLoading) return <ComponentLoading />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-10 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Đã có lỗi xảy ra</h2>
        <p className="text-slate-500 mb-6 max-w-md">Không thể tải dữ liệu Pipeline. Vui lòng kiểm tra lại kết nối hoặc liên hệ kỹ thuật.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 pt-6">
      <div className="px-6 flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline Bán hàng</h1>
          <p className="text-sm text-slate-500">Quản lý cơ hội kinh doanh theo từng giai đoạn</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-100 flex items-center gap-2">
            <TrendingUp size={16} />
            <span className="font-bold">{formatVND(totalValue)}</span>
            <span className="text-xs opacity-70">tổng pipeline</span>
          </div>
          <button
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:shadow-lg transition-all"
            onClick={() => handleAddDeal('lead')}
          >
            <Plus size={16} />
            Thêm deal
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 pb-4 flex items-center gap-3 shrink-0">
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Tìm deal, khách hàng..."
            className="pl-10 bg-white border-slate-200"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select value={filters.ownerId} onValueChange={val => setFilters({ ...filters, ownerId: val })}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="Nhân viên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhân viên</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.productType} onValueChange={val => setFilters({ ...filters, productType: val })}>
          <SelectTrigger className="w-[150px] bg-white border-slate-200">
            <SelectValue placeholder="Loại sản phẩm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi sản phẩm</SelectItem>
            {Object.entries(PRODUCT_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-400 font-medium ml-2">{deals.length} deals</span>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6 pt-0">
        <div className="flex gap-4 h-full min-w-max">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.id}
                id={stage.id}
                label={stage.label}
                color={stage.color}
                deals={deals.filter(d => d.stage === stage.id)}
                onAddDeal={handleAddDeal}
                onEditDeal={setEditingDeal}
                onDeleteDeal={setDeletingDeal}
              />
            ))}
            <DragOverlay dropAnimation={null}>
              {activeDeal ? <DealCard deal={activeDeal} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <AddDealDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        defaultStage={addStage}
      />

      <EditDealDialog
        deal={editingDeal}
        open={!!editingDeal}
        onOpenChange={(open) => { if (!open) setEditingDeal(null); }}
      />

      <DeleteConfirmDialog
        deal={deletingDeal}
        open={!!deletingDeal}
        onOpenChange={(open) => { if (!open) setDeletingDeal(null); }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
