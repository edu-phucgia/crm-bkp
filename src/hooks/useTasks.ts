import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

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
    onSuccess: () => {
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
    }
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    updateStatus: updateTaskStatusMutation.mutate,
    createTask: createTaskMutation.mutate,
    isUpdating: updateTaskStatusMutation.isPending
  };
}
