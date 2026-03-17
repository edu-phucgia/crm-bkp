import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface ZaloGroup {
  id: string;
  customer_id: string;
  group_name: string | null;
  status: 'active' | 'silent_30' | 'silent_90' | 'silent_180';
  created_at: string;
  customer: {
    company_name: string;
  };
}

export interface ZaloFilters {
  status?: string;
  search?: string;
}

export function useZaloGroups(filters: ZaloFilters = {}) {
  const queryClient = useQueryClient();

  // 1. Fetch Zalo Groups
  const groupsQuery = useQuery({
    queryKey: ['zalo-groups', filters],
    queryFn: async () => {
      let query = supabase
        .from('zalo_groups')
        .select('*, customer:customers(company_name)')
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = data as ZaloGroup[];

      if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(
          g =>
            g.group_name?.toLowerCase().includes(s) ||
            g.customer?.company_name?.toLowerCase().includes(s)
        );
      }

      return result;
    },
  });

  // 2. Fetch Customers for dropdown
  const customersQuery = useQuery({
    queryKey: ['customers-simple-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('status', 'active')
        .order('company_name');
      if (error) throw error;
      return data as { id: string; company_name: string }[];
    },
  });

  // 3. Create Group
  const createGroupMutation = useMutation({
    mutationFn: async (payload: { customer_id: string; group_name: string }) => {
      const { error } = await supabase.from('zalo_groups').insert({
        customer_id: payload.customer_id,
        group_name: payload.group_name,
        status: 'active',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zalo-groups'] });
      toast.success('Thêm nhóm Zalo thành công');
    },
    onError: (err: Error) => toast.error(`Lỗi thêm nhóm: ${err.message}`),
  });

  // 4. Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ZaloGroup['status'] }) => {
      const { error } = await supabase
        .from('zalo_groups')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zalo-groups'] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: (err: Error) => toast.error(`Lỗi cập nhật: ${err.message}`),
  });

  // 5. Delete Group
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('zalo_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zalo-groups'] });
      toast.success('Đã xóa nhóm Zalo');
    },
    onError: (err: Error) => toast.error(`Lỗi xóa: ${err.message}`),
  });

  // 6. Log Zalo Message → feeds SLA Monitor
  const logMessageMutation = useMutation({
    mutationFn: async (payload: { customer_id: string; content: string; customer_name?: string }) => {
      const { error } = await supabase.from('activities').insert({
        type: 'zalo',
        content: payload.content,
        customer_id: payload.customer_id,
        customer_name: payload.customer_name || null,
        activity_at: new Date().toISOString(),
        activity_date: new Date().toISOString(),
        response_time_minutes: null,
        is_sla_violation: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-unresponded'] });
      queryClient.invalidateQueries({ queryKey: ['sla-stats'] });
      toast.success('Đã ghi nhận tin nhắn Zalo — SLA đang theo dõi');
    },
    onError: (err: Error) => toast.error(`Lỗi ghi nhận: ${err.message}`),
  });

  // KPI counts derived from all groups (unfiltered)
  const allGroupsQuery = useQuery({
    queryKey: ['zalo-groups-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zalo_groups')
        .select('status');
      if (error) throw error;
      return data as { status: string }[];
    },
  });

  const kpi = {
    active: allGroupsQuery.data?.filter(g => g.status === 'active').length ?? 0,
    silent_30: allGroupsQuery.data?.filter(g => g.status === 'silent_30').length ?? 0,
    silent_90: allGroupsQuery.data?.filter(g => g.status === 'silent_90').length ?? 0,
    silent_180: allGroupsQuery.data?.filter(g => g.status === 'silent_180').length ?? 0,
  };

  return {
    groups: groupsQuery.data ?? [],
    isLoading: groupsQuery.isLoading,
    isError: groupsQuery.isError,
    customers: customersQuery.data ?? [],
    kpi,
    createGroup: createGroupMutation.mutate,
    isCreating: createGroupMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    deleteGroup: deleteGroupMutation.mutate,
    isDeleting: deleteGroupMutation.isPending,
    logMessage: logMessageMutation.mutate,
    isLogging: logMessageMutation.isPending,
  };
}
