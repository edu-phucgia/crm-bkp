import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_to: string;
  created_at: string;
  assignee?: {
    full_name: string;
  };
}

export function useTasks() {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      console.log('useTasks: Fetching tasks');
      const now = new Date().toISOString();

      // First, update overdue tasks in DB (simple way to sync)
      // Note: In production, this should be a DB trigger or Cron.
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'overdue' })
        .lt('due_date', now)
        .neq('status', 'done');
      
      if (updateError) console.error('Error auto-marking overdue tasks:', updateError);

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!assigned_to(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);
      if (error) throw error;
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], (old) => {
        if (!old) return old;
        return old.map(t => t.id === taskId ? { ...t, status: status as Task['status'] } : t);
      });
      return { previousTasks };
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái nhiệm vụ thành công');
    },
    onError: (error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error(`Lỗi cập nhật trạng thái nhiệm vụ: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { error } = await supabase.from('tasks').insert(task);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Thêm nhiệm vụ thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi thêm nhiệm vụ: ${error.message}`);
    }
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    updateStatus: updateTaskStatusMutation.mutate,
    createTask: createTaskMutation.mutate,
    isUpdating: updateTaskStatusMutation.isPending,
    isCreating: createTaskMutation.isPending
  };
}
