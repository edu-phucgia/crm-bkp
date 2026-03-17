import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// ============================================================
//  Interface khớp đúng với schema Supabase đã tạo
// ============================================================
export interface Customer {
  id: string;
  company_name: string;
  short_name: string | null;
  industry: string | null;
  source: string | null;
  tier: 'standard' | 'silver' | 'gold' | 'vip';   // ← đúng enum DB
  status: 'active' | 'inactive' | 'blacklist';
  assigned_to: string | null;                        // email (không phải UUID)
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Computed sau khi join
  sales_name?: string;
  deal_count?: number;
  zalo_count?: number;
  zalo_status?: string;
}

export interface CustomerFilters {
  status?: string;
  tier?: string;
  assigned_to?: string;
  search?: string;
}

// ============================================================
//  useCustomers — Danh sách + phân trang + filter
// ============================================================
export function useCustomers(
  filters: CustomerFilters = {},
  page: number = 1,
  pageSize: number = 20
) {
  const listQuery = useQuery({
    queryKey: ['customers', filters, page],
    queryFn: async () => {
      console.log('useCustomers: Fetching list', { filters, page });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Join đúng cú pháp Supabase:
      // - users join qua cột assigned_to (email = email), không dùng FK UUID
      // - deals và zalo_groups join qua customer_id
      let query = supabase
        .from('customers')
        .select(
          `*,
           deals(id),
           zalo_groups(id, status)`,
          { count: 'exact' }
        );

      // Áp dụng filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.tier && filters.tier !== 'all') {
        query = query.eq('tier', filters.tier);
      }
      if (filters.assigned_to && filters.assigned_to !== 'all') {
        // Filter theo email (assigned_to lưu email, không phải UUID)
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.search && filters.search.trim()) {
        query = query.ilike('company_name', `%${filters.search.trim()}%`);
      }

      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      console.log('useCustomers: Response', { count, rows: data?.length, error });

      if (error) {
        console.error('useCustomers: ERROR', error.code, error.message);
        throw new Error(error.message);
      }

      // Map email → tên nhân viên (gọi riêng vì join qua email không phải FK chuẩn)
      const emails = [...new Set((data || []).map((c: any) => c.assigned_to).filter(Boolean))];
      let userMap: Record<string, string> = {};

      if (emails.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('email, full_name')
          .in('email', emails);
        userMap = Object.fromEntries((users || []).map((u: any) => [u.email, u.full_name]));
      }

      const processedData: Customer[] = (data as any[]).map(c => ({
        ...c,
        sales_name: userMap[c.assigned_to] || c.assigned_to || 'Chưa gán',
        deal_count: c.deals?.length || 0,
        zalo_count: c.zalo_groups?.length || 0,
        zalo_status: c.zalo_groups?.[0]?.status || 'none',
      }));

      return { data: processedData, count: count || 0 };
    },
    staleTime: 30_000,
    retry: 1,
  });

  const queryClient = useQueryClient();

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          company_name: customer.company_name,
          short_name: customer.short_name,
          industry: customer.industry,
          source: customer.source,
          tier: customer.tier || 'standard',
          status: customer.status || 'active',
          assigned_to: customer.assigned_to,
          notes: customer.notes
        })
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Thêm khách hàng thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi thêm khách hàng: ${error.message}`);
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({
          company_name: updates.company_name,
          short_name: updates.short_name,
          industry: updates.industry,
          source: updates.source,
          tier: updates.tier,
          status: updates.status,
          assigned_to: updates.assigned_to,
          notes: updates.notes
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      toast.success('Cập nhật khách hàng thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi cập nhật: ${error.message}`);
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
        
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Xóa khách hàng thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi xóa: ${error.message}`);
    }
  });

  return {
    ...listQuery,
    customers: listQuery.data?.data || [],
    totalCount: listQuery.data?.count || 0,
    addCustomer: addCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    deleteCustomer: deleteCustomerMutation.mutate,
    isAdding: addCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    isDeleting: deleteCustomerMutation.isPending,
  };
}

// ============================================================
//  useCustomerDetail — Hồ sơ 360° (4 tab)
// ============================================================
export function useCustomerDetail(id: string) {
  const queryClient = useQueryClient();

  // Chi tiết KH
  const detailQuery = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          deals(id, stage, value),
          orders(id, total_value, payment_status, current_step)
        `)
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);

      // Lấy tên nhân viên phụ trách
      let sales_name = 'Chưa gán';
      if (data.assigned_to) {
        const { data: user } = await supabase
          .from('users')
          .select('full_name')
          .eq('email', data.assigned_to)
          .single();
        if (user) sales_name = user.full_name;
      }

      // Tính KPI
      const orders = data.orders || [];
      const deals = data.deals || [];
      const paidOrders = orders.filter((o: any) => o.payment_status === 'paid_full');
      const totalRevenue = paidOrders.reduce((s: number, o: any) => s + Number(o.total_value || 0), 0);
      const winDeals = deals.filter((d: any) => d.stage === 'hoan_thanh').length;
      const winRate = deals.length > 0 ? Math.round((winDeals / deals.length) * 100) : 0;

      return {
        ...data,
        sales_name,
        kpis: {
          totalOrders: orders.length,
          totalRevenue,
          winRate,
          totalDeals: deals.length,
        },
      };
    },
    enabled: !!id,
  });

  // Timeline hoạt động — dùng đúng cột activity_date (không phải activity_at)
  const activitiesQuery = useQuery({
    queryKey: ['customer-activities', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('customer_id', id)
        .order('activity_date', { ascending: false }); // ← đúng tên cột trong DB
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!id,
  });

  // Đơn hàng
  const ordersQuery = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!id,
  });

  // Báo giá
  const quotesQuery = useQuery({
    queryKey: ['customer-quotes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, quotation_items(*)')  // join items luôn
        .eq('customer_id', id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!id,
  });

  // Hợp đồng
  const contractsQuery = useQuery({
    queryKey: ['customer-contracts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!id,
  });

  // Thêm hoạt động mới
  const addActivity = useMutation({
    mutationFn: async (activity: {
      type: string;
      content: string;
      activity_date?: string;
      performed_by?: string;
      order_code?: string;
    }) => {
      const { error } = await supabase.from('activities').insert({
        ...activity,
        customer_id: id,
        customer_name: detailQuery.data?.company_name,
        activity_date: activity.activity_date || new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      // Cập nhật lại danh sách hoạt động và chi tiết KH
      queryClient.invalidateQueries({ queryKey: ['customer-activities', id] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Thêm hoạt động thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi thêm hoạt động: ${error.message}`);
    }
  });

  // Cập nhật trạng thái KH
  const updateStatus = useMutation({
    mutationFn: async ({ status, reason }: { status: string; reason?: string }) => {
      const updateData: any = { status };
      if (reason) updateData.notes = reason; // lưu lý do vào notes
      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: (error) => {
      toast.error(`Lỗi cập nhật trạng thái: ${error.message}`);
    }
  });

  return {
    customer: detailQuery.data,
    activities: activitiesQuery.data || [],
    orders: ordersQuery.data || [],
    quotes: quotesQuery.data || [],
    contracts: contractsQuery.data || [],
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
    error: detailQuery.error,
    addActivity: addActivity.mutate,
    updateStatus: updateStatus.mutate,
    isMutating: addActivity.isPending || updateStatus.isPending,
  };
}

// ============================================================
//  useUsersList — Dùng cho dropdown filter nhân viên
// ============================================================
export function useUsersList() {
  return useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60_000, // cache 5 phút
  });
}