import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { startOfMonth, startOfToday, subDays, addDays, format, parseISO } from 'date-fns';

export interface DashboardStats {
  kpi: {
    monthlyRevenue: number;
    newDealsWeek: number;
    closingRate: number;
    activeZaloGroups: number;
  };
  revenueChart: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  pipelineFunnel: {
    stage: string;
    count: number;
    value: number;
  }[];
  employeePerformance: {
    id: string;
    name: string;
    targetMonthly: number;
    actualRevenue: number;
    completionRate: number;
    dealsCount: number;
    winRate: number;
  }[];
  alerts: {
    slaViolations: number;
    expiringContracts: number;
  };
}

const STAGES_ORDER = [
  'lead',
  'tu_van',
  'gui_bao_gia',
  'dam_phan',
  'chot_hd',
  'dang_tn',
  'hoan_thanh'
];

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  tu_van: 'Tư vấn',
  gui_bao_gia: 'Gửi báo giá',
  dam_phan: 'Đàm phán',
  chot_hd: 'Chốt HĐ',
  dang_tn: 'Đang TN',
  hoan_thanh: 'Hoàn thành',
  lost: 'Thất bại'
};

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('useDashboardStats: Khởi chạy lấy dữ liệu dashboard');

      const now = new Date();
      const firstDayOfMonth = startOfMonth(now).toISOString();
      const sevenDaysAgo = subDays(now, 7).toISOString();
      const todayStart = startOfToday().toISOString();
      const thirtyDaysNext = addDays(now, 30).toISOString();

      // 1. Fetch data for KPI Cards
      const [
        { data: monthlyOrders, error: monthlyOrdersError },
        { count: newDealsCount, error: newDealsError },
        { data: allDeals, error: allDealsError },
        { count: activeZaloCount, error: activeZaloError },
        { data: allUsers, error: allUsersError },
        { data: slaActivities, error: slaError },
        { count: expiringContractsCount, error: contractsError },
        { data: last12MonthsOrders, error: chartOrdersError },
        { data: currentMonthPerformanceOrders, error: perfOrdersError }
      ] = await Promise.all([
        // Monthly revenue
        supabase.from('orders').select('total_value').eq('status', 'completed').gte('created_at', firstDayOfMonth),
        // New deals week
        supabase.from('deals').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        // Closing rate (all deals)
        supabase.from('deals').select('stage, value, owner_id'),
        // Active Zalo groups
        supabase.from('zalo_groups').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        // Employee performance
        supabase.from('users').select('id, full_name, target_monthly'),
        // SLA violations today
        supabase.from('activities').select('*').eq('is_sla_violation', true).gte('activity_at', todayStart),
        // Expiring contracts
        supabase.from('contracts').select('*', { count: 'exact', head: true }).lte('end_date', thirtyDaysNext).gte('end_date', format(now, 'yyyy-MM-dd')),
        // 12 months chart
        supabase.from('orders').select('total_value, created_at, assigned_sales_id').eq('status', 'completed').gte('created_at', subDays(now, 365).toISOString()),
        // Current month performance by user
        supabase.from('orders').select('total_value, assigned_sales_id').eq('status', 'completed').gte('created_at', firstDayOfMonth)
      ]);

      if (monthlyOrdersError) console.error('monthlyOrdersError', monthlyOrdersError);
      if (newDealsError) console.error('newDealsError', newDealsError);
      if (allDealsError) console.error('allDealsError', allDealsError);
      if (activeZaloError) console.error('activeZaloError', activeZaloError);
      if (allUsersError) console.error('allUsersError', allUsersError);
      if (slaError) console.error('slaError', slaError);
      if (contractsError) console.error('contractsError', contractsError);
      if (chartOrdersError) console.error('chartOrdersError', chartOrdersError);
      if (perfOrdersError) console.error('perfOrdersError', perfOrdersError);

      // KPI Calculations
      const monthlyRevenue = monthlyOrders?.reduce((sum, o) => sum + Number(o.total_value), 0) || 0;
      const totalDeals = allDeals?.length || 0;
      const completedDeals = allDeals?.filter(d => d.stage === 'hoan_thanh').length || 0;
      const closingRate = totalDeals > 0 ? (completedDeals / totalDeals) * 100 : 0;

      // Pipeline Funnel
      const pipelineData = STAGES_ORDER.map(stage => {
        const stageDeals = allDeals?.filter(d => d.stage === stage) || [];
        return {
          stage: STAGE_LABELS[stage],
          count: stageDeals.length,
          value: stageDeals.reduce((sum, d) => sum + Number(d.value), 0)
        };
      });

      // Employee Performance
      const employeePerformance = (allUsers || []).map(user => {
        const userDeals = allDeals?.filter(d => d.owner_id === user.id) || [];
        const userWinCount = userDeals.filter(d => d.stage === 'hoan_thanh').length;
        const userRevenue = currentMonthPerformanceOrders?.filter(o => o.assigned_sales_id === user.id).reduce((sum, o) => sum + Number(o.total_value), 0) || 0;

        return {
          id: user.id,
          name: user.full_name,
          targetMonthly: Number(user.target_monthly) || 0,
          actualRevenue: userRevenue,
          completionRate: Number(user.target_monthly) > 0 ? (userRevenue / Number(user.target_monthly)) * 100 : 0,
          dealsCount: userDeals.length,
          winRate: userDeals.length > 0 ? (userWinCount / userDeals.length) * 100 : 0
        };
      });

      // 12 Months Chart data processing
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = subDays(now, i * 30); // Approximate
        months.push(format(d, 'MM/yyyy'));
      }
      
      const revenueChart = months.map(m => {
        const monthOrders = last12MonthsOrders?.filter(o => {
          const date = parseISO(o.created_at);
          return format(date, 'MM/yyyy') === m;
        }) || [];
        return {
          month: m,
          revenue: monthOrders.reduce((sum, o) => sum + Number(o.total_value), 0),
          orders: monthOrders.length
        };
      });

      return {
        kpi: {
          monthlyRevenue,
          newDealsWeek: newDealsCount || 0,
          closingRate,
          activeZaloGroups: activeZaloCount || 0
        },
        revenueChart,
        pipelineFunnel: pipelineData,
        employeePerformance,
        alerts: {
          slaViolations: slaActivities?.length || 0,
          expiringContracts: expiringContractsCount || 0
        }
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
