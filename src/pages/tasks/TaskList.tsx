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
  Plus, Calendar, Search
} from 'lucide-react';
import { useTasks, Task } from '../../hooks/useTasks';
import { Card, CardContent } from '../../app/components/ui/card';
import { Badge } from '../../app/components/ui/badge';
import { Skeleton } from '../../app/components/ui/skeleton';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { format, parseISO, isPast } from 'date-fns';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'todo', label: 'Cần làm', color: '#64748b' },
  { id: 'in_progress', label: 'Đang làm', color: '#3b82f6' },
  { id: 'done', label: 'Hoàn thành', color: '#10b981' },
  { id: 'overdue', label: 'Quá hạn', color: '#ef4444' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-100 text-blue-600 border-blue-200',
  high: 'bg-orange-100 text-orange-600 border-orange-200',
  urgent: 'bg-red-100 text-red-600 border-red-200',
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function KanbanColumn({ id, label, color, tasks }: { id: string, label: string, color: string, tasks: Task[] }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="flex flex-col w-72 shrink-0 bg-slate-100 rounded-xl border border-slate-200 max-h-[calc(100vh-180px)]">
      <div className="p-3 border-b-2 bg-white rounded-t-xl flex items-center justify-between" style={{ borderColor: color }}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-700">{label}</span>
          <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-5">
            {tasks.length}
          </Badge>
        </div>
        <Plus size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-[10px] text-slate-400 font-medium italic">Kéo thả việc vào đây</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

function TaskCard({ task, isOverlay }: { task: Task, isOverlay?: boolean }) {
  const isUrgent = task.priority === 'urgent' || task.priority === 'high';
  const overdue = task.status !== 'done' && task.due_date && isPast(parseISO(task.due_date));

  return (
    <Card className={`group shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-xl' : ''} ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardContent className="p-3 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{task.title}</h4>
          <Badge className={`text-[8px] px-1 py-0 h-4 uppercase ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </Badge>
        </div>

        <p className="text-[10px] text-slate-500 line-clamp-2">{task.description}</p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
              {task.assignee?.full_name?.charAt(0) || '?'}
            </div>
            <span className="text-[9px] font-medium text-slate-500">{task.assignee?.full_name || 'Unassigned'}</span>
          </div>
          <div className={`flex items-center gap-1 text-[9px] ${overdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            <Calendar size={10} />
            {task.due_date ? format(parseISO(task.due_date), 'dd/MM') : 'N/A'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function TaskList() {
  const { tasks, isLoading, updateStatus } = useTasks();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.assignee?.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id.toString());

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const overId = over.id.toString();
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    let newStatus = '';
    if (COLUMNS.some(c => c.id === overId)) {
      newStatus = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus && newStatus !== activeTask.status) {
      updateStatus({ taskId: activeTask.id, status: newStatus }, {
        onSuccess: () => toast.success('Đã cập nhật trạng thái công việc')
      });
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (isLoading) return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col gap-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Công việc</h1>
          <p className="text-slate-500 text-sm italic">Quản lý hiệu suất làm việc nhóm</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Tìm việc, người thực hiện..." 
              className="pl-9 bg-white" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button className="font-bold"><Plus size={18} className="mr-2" /> Thêm việc</Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map(col => (
              <KanbanColumn 
                key={col.id} 
                id={col.id} 
                label={col.label} 
                color={col.color} 
                tasks={filteredTasks.filter(t => t.status === col.id)} 
              />
            ))}
            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
