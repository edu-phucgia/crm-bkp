import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

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

export function usePipelineDeals(filters: PipelineFilters) {
  const queryClient = useQueryClient();

  // 1. Fetch Deals
  const dealsQuery = useQuery({
    queryKey: ['pipeline-deals', filters],
    queryFn: async () => {
      console.log('usePipelineDeals: Fetching deals with filters', filters);
      let query = supabase
        .from('deals')
        .select(`
          *,
          customer:customers(company_name),
          owner:users(full_name)
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

  // 3. Update Deal Stage Mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, newStage, oldStage, customerId }: { dealId: string, newStage: string, oldStage: string, customerId: string }) => {
      console.log(`usePipelineDeals: Updating deal ${dealId} from ${oldStage} to ${newStage}`);
      
      const { error: updateError } = await supabase
        .from('deals')
        .update({ 
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (updateError) throw updateError;

      // Activity labels for log
      const STAGE_LABELS: Record<string, string> = {
        lead: 'Lead',
        tu_van: 'Tư vấn',
        gui_bao_gia: 'Gửi báo giá',
        dam_phan: 'Đàm phán',
        chot_hd: 'Chốt HĐ',
        dang_tn: 'Đang TN',
        hoan_thanh: 'Hoàn thành'
      };

      // Create activity log
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
    }
  });

  return {
    deals: dealsQuery.data || [],
    isLoading: dealsQuery.isLoading || usersQuery.isLoading,
    isError: dealsQuery.isError,
    error: dealsQuery.error,
    users: usersQuery.data || [],
    updateStage: updateStageMutation.mutate,
    isUpdating: updateStageMutation.isPending
  };
}
