import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  useDroppable,
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
  Plus, Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import { usePipelineDeals, Deal } from '../../hooks/usePipelineDeals';
import { Card, CardContent } from '../../app/components/ui/card';
import { Badge } from '../../app/components/ui/badge';
import { Skeleton } from '../../app/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import { Input } from '../../app/components/ui/input';
import { differenceInDays, parseISO, format } from 'date-fns';

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

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

interface ColumnProps {
  id: string;
  label: string;
  color: string;
  deals: Deal[];
}

function KanbanColumn({ id, label, color, deals }: ColumnProps) {
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
          <button className="text-slate-400 hover:text-slate-600">
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
            <SortableDealCard key={deal.id} deal={deal} />
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

function SortableDealCard({ deal }: { deal: Deal }) {
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} />
    </div>
  );
}

function DealCard({ deal, isOverlay }: { deal: Deal, isOverlay?: boolean }) {
  const urgent = deal.expected_close_date ? differenceInDays(parseISO(deal.expected_close_date), new Date()) < 7 : false;
  const productStyle = PRODUCT_COLORS[deal.product_type] || PRODUCT_COLORS['khac'];

  return (
    <Card 
      className={`group relative hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4 ${isOverlay ? 'shadow-xl' : ''}`}
      style={{ borderLeftColor: urgent ? '#ef4444' : 'transparent' }}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <p className="text-[11px] font-bold text-slate-900 line-clamp-1">{deal.customer?.company_name}</p>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={10} /></button>
          </div>
        </div>

        <h4 className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-tight">
          {deal.title}
        </h4>

        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-primary">{formatVND(deal.value)}</p>
          <Badge 
            variant="outline" 
            className="text-[9px] px-1.5 py-0 border leading-none h-4"
            style={{ backgroundColor: productStyle.bg, color: productStyle.text, borderColor: productStyle.border }}
          >
            {PRODUCT_LABELS[deal.product_type] || 'Khác'}
          </Badge>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
              {deal.owner?.full_name?.charAt(0)}
            </div>
            <span className="text-[9px] font-medium text-slate-500">{deal.owner?.full_name}</span>
          </div>
          <div className={`flex items-center gap-1 text-[9px] ${urgent ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            <Calendar size={10} />
            {deal.expected_close_date ? format(parseISO(deal.expected_close_date), 'dd/MM') : 'N/A'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Pipeline() {
  const [filters, setFilters] = useState<any>({ ownerId: 'all', productType: 'all', search: '' });
  const { deals, isLoading, users, updateStage } = usePipelineDeals(filters);
  const [activeId, setActiveId] = useState<string | null>(null);

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

    // Determine the new stage
    // dnd-kit gives us the id of the 'over' element. 
    // In our case, the over element could be a Column (if we make columns droppable) or another Card.
    // To simplify, let's look at what's under the cursor.
    const overId = over.id.toString();
    let newStage = '';

    // Check if overId is a stage id
    if (STAGES.some(s => s.id === overId)) {
      newStage = overId;
    } else {
      // It's a deal id, get its stage
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

  const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0);
  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  if (isLoading) return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;

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
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 group hover:shadow-lg transition-all"
            onClick={() => toast.info('Chức năng thêm deal đang được phát triển')}
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
            onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <Select value={filters.ownerId} onValueChange={val => setFilters({...filters, ownerId: val})}>
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
        <Select value={filters.productType} onValueChange={val => setFilters({...filters, productType: val})}>
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
            collisionDetection={closestCorners}
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
              />
            ))}
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.4',
                  },
                },
              }),
            }}>
              {activeDeal ? <DealCard deal={activeDeal} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
