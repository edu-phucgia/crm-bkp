import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { supabasePatch } from '../lib/supabasePatch';
import { toast } from 'sonner';

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  product_type: string;
  expected_close_date: string;
  customer_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  customer: {
    company_name: string;
  };
  owner: {
    full_name: string;
  };
}

export interface PipelineFilters {
  ownerId?: string;
  productType?: string;
  search?: string;
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  tu_van: 'Tư vấn',
  gui_bao_gia: 'Gửi báo giá',
  dam_phan: 'Đàm phán',
  chot_hd: 'Chốt HĐ',
  dang_tn: 'Đang TN',
  hoan_thanh: 'Hoàn thành'
};

export function usePipelineDeals(filters: PipelineFilters) {
  const queryClient = useQueryClient();

  // 1. Fetch Deals
  const dealsQuery = useQuery({
    queryKey: ['pipeline-deals', filters],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select(`
          *,
          customer:customers(company_name),
          owner:users!deals_owner_id_fkey(full_name)
        `)
        .neq('stage', 'lost')
        .order('created_at', { ascending: false });

      if (filters.ownerId && filters.ownerId !== 'all') {
        query = query.eq('owner_id', filters.ownerId);
      }
      if (filters.productType && filters.productType !== 'all') {
        query = query.eq('product_type', filters.productType);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data as Deal[];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(deal =>
          deal.title.toLowerCase().includes(searchLower) ||
          deal.customer.company_name.toLowerCase().includes(searchLower)
        );
      }

      return filteredData;
    }
  });

  // 2. Fetch Users for filter
  const usersQuery = useQuery({
    queryKey: ['pipeline-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('id, full_name').eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  // 3. Update Deal Stage Mutation (optimistic)
  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, newStage, oldStage, customerId }: { dealId: string, newStage: string, oldStage: string, customerId: string }) => {
      const { error: updateError } = await supabase
        .from('deals')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', dealId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('activities')
        .insert({
          type: 'stage_change',
          content: `Chuyển giai đoạn từ ${STAGE_LABELS[oldStage] || oldStage} sang ${STAGE_LABELS[newStage] || newStage}`,
          deal_id: dealId,
          customer_id: customerId,
          activity_at: new Date().toISOString()
        });

      if (logError) console.error('Error logging stage change:', logError);
    },
    onMutate: async ({ dealId, newStage }) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline-deals'] });
      const previousDeals = queryClient.getQueryData<Deal[]>(['pipeline-deals', filters]);
      queryClient.setQueryData<Deal[]>(['pipeline-deals', filters], (old) => {
        if (!old) return old;
        return old.map(deal => deal.id === dealId ? { ...deal, stage: newStage } : deal);
      });
      return { previousDeals };
    },
    onSuccess: () => {
      toast.success('Chuyển giai đoạn thành công');
    },
    onError: (error, _variables, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(['pipeline-deals', filters], context.previousDeals);
      }
      toast.error(`Lỗi chuyển giai đoạn: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
    }
  });

  // 4. Create Deal Mutation
  const createDealMutation = useMutation({
    mutationFn: async (deal: Partial<Deal>) => {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          title:               deal.title,
          value:               deal.value,
          stage:               deal.stage || 'lead',
          product_type:        deal.product_type,
          expected_close_date: deal.expected_close_date || null,
          customer_id:         deal.customer_id,
          owner_id:            deal.owner_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
      toast.success('Thêm deal mới thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi thêm deal: ${error.message}`);
    }
  });

  // 5. Update Deal Mutation (edit all fields)
  const updateDealMutation = useMutation({
    mutationFn: async (deal: Partial<Deal> & { id: string }) => {
      const { error } = await supabase
        .from('deals')
        .update({
          title:               deal.title,
          value:               deal.value ?? 0,
          stage:               deal.stage,
          product_type:        deal.product_type,
          customer_id:         deal.customer_id,
          owner_id:            deal.owner_id ?? null,
          expected_close_date: deal.expected_close_date || null,
          updated_at:          new Date().toISOString(),
        })
        .eq('id', deal.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
      toast.success('Cập nhật deal thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi cập nhật: ${error.message}`);
    }
  });

  // 6. Delete Deal Mutation (soft delete → stage = 'lost')
  const deleteDealMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('deals')
        .update({ stage: 'lost', updated_at: new Date().toISOString() })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
      toast.success('Đã xóa deal khỏi pipeline');
    },
    onError: (error) => {
      toast.error(`Lỗi xóa deal: ${error.message}`);
    }
  });

  return {
    deals: dealsQuery.data || [],
    isLoading: dealsQuery.isLoading || usersQuery.isLoading,
    isError: dealsQuery.isError,
    error: dealsQuery.error,
    users: usersQuery.data || [],
    updateStage: updateStageMutation.mutate,
    isUpdating: updateStageMutation.isPending,
    createDeal: createDealMutation.mutate,
    isCreating: createDealMutation.isPending,
    updateDeal: updateDealMutation.mutate,
    isUpdatingDeal: updateDealMutation.isPending,
    deleteDeal: deleteDealMutation.mutate,
    isDeleting: deleteDealMutation.isPending,
  };
}
