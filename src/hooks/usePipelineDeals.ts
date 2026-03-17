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
  payment_status: 'chua_tam_ung' | 'tam_ung_50' | 'thanh_toan_du';
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

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function getAutoTasks(newStage: string, dealTitle: string, ownerId: string) {
  const base = { status: 'todo', assigned_to: ownerId };
  switch (newStage) {
    case 'gui_bao_gia':
      return [{
        ...base,
        title: `Nhắc xác nhận báo giá: ${dealTitle}`,
        description: 'Sau 1-2 ngày gửi báo giá, nhắc khách hàng xác nhận nếu chưa phản hồi',
        priority: 'medium',
        due_date: addDays(2),
      }];
    case 'chot_hd':
      return [
        {
          ...base,
          title: `Gửi địa chỉ nhận mẫu: ${dealTitle}`,
          description: 'Gửi địa chỉ nhận mẫu cho KH: Cảng cạn ICD Long Biên, số 1 Huỳnh Tấn Phát, Long Biên, HN',
          priority: 'high',
          due_date: addDays(1),
        },
        {
          ...base,
          title: `Nhận địa chỉ trả mẫu từ KH: ${dealTitle}`,
          description: 'Yêu cầu khách hàng cung cấp địa chỉ nhận lại mẫu sau khi thử nghiệm xong',
          priority: 'high',
          due_date: addDays(1),
        },
      ];
    case 'dang_tn':
      return [{
        ...base,
        title: `Check tạm ứng 50%: ${dealTitle}`,
        description: 'Kiểm tra khách hàng đã tạm ứng 50% chi phí chưa. Nếu chưa, nhắc và gửi thông tin chuyển khoản ACB 896668',
        priority: 'urgent',
        due_date: addDays(0),
      }];
    case 'hoan_thanh':
      return [{
        ...base,
        title: `Xác nhận thanh toán đủ 100%: ${dealTitle}`,
        description: 'Check với Ninh/Ngọc: KH đã thanh toán đủ chưa trước khi phát hành kết quả',
        priority: 'urgent',
        due_date: addDays(0),
      }];
    default:
      return [];
  }
}

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
    mutationFn: async ({ dealId, newStage, oldStage, customerId, value, ownerId, dealTitle }: { dealId: string, newStage: string, oldStage: string, customerId: string, value: number, ownerId: string, dealTitle: string }) => {
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

      // Tự động tạo tasks theo quy trình khi chuyển stage
      const autoTasks = getAutoTasks(newStage, dealTitle, ownerId);
      if (autoTasks.length > 0) {
        const { error: taskError } = await supabase.from('tasks').insert(autoTasks);
        if (taskError) console.error('Error creating auto tasks:', taskError);
      }

      // Tự động tạo order khi deal chuyển sang Hoàn thành
      if (newStage === 'hoan_thanh' && oldStage !== 'hoan_thanh') {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('deal_id', dealId)
          .maybeSingle();

        if (!existingOrder) {
          const { error: orderError } = await supabase
            .from('orders')
            .insert({
              deal_id: dealId,
              customer_id: customerId,
              assigned_sales_id: ownerId,
              total_value: value,
              status: 'completed',
              payment_status: 'paid_full',
              created_at: new Date().toISOString(),
            });

          if (orderError) console.error('Error creating order from deal:', orderError);
        }
      }
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
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (variables.newStage === 'hoan_thanh') {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['customer-orders', variables.customerId] });
      }
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
          payment_status:      deal.payment_status || 'chua_tam_ung',
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
          payment_status:      deal.payment_status,
          customer_id:         deal.customer_id,
          owner_id:            deal.owner_id ?? null,
          expected_close_date: deal.expected_close_date || null,
          updated_at:          new Date().toISOString(),
        })
        .eq('id', deal.id);

      if (error) throw error;

      // Tự động tạo order nếu save với stage Hoàn thành
      if (deal.stage === 'hoan_thanh') {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('deal_id', deal.id)
          .maybeSingle();

        if (!existingOrder) {
          const { error: orderError } = await supabase
            .from('orders')
            .insert({
              deal_id:            deal.id,
              customer_id:        deal.customer_id,
              assigned_sales_id:  deal.owner_id,
              total_value:        deal.value ?? 0,
              status:             'completed',
              payment_status:     'paid_full',
              created_at:         new Date().toISOString(),
            });

          if (orderError) console.error('Error creating order from deal edit:', orderError);
        }
      }
    },
    onSuccess: (_data, deal) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
      if (deal.stage === 'hoan_thanh') {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['customer-orders', deal.customer_id] });
      }
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
