import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'sales' | 'tech' | 'manager';
  status: 'active' | 'inactive';
  created_at: string;
}

export function useUsersManager() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['manage-users'],
    queryFn: async () => {
      console.log('useUsersManager: Fetching users');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as User[];
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string, fields: Partial<User> }) => {
      const { error } = await supabase
        .from('users')
        .update(fields)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-users'] });
      toast.success('Cập nhật người dùng thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi cập nhật người dùng: ${error.message}`);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-users'] });
      toast.success('Xóa người dùng thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi xóa người dùng: ${error.message}`);
    }
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isUpdating: updateUserMutation.isPending
  };
}
