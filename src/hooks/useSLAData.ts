import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { startOfToday, subDays, differenceInMinutes, parseISO } from 'date-fns';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface SLAActivity {
  id: string;
  type: string;
  content: string;
  activity_at: string;
  response_time_minutes: number | null;
  is_sla_violation: boolean;
  customer: {
    company_name: string;
    id: string;
  };
  user: {
    full_name: string;
    id: string;
  };
}

export interface SLAStats {
  waitingCount: number;
  violationsToday: number;
  avgResponseTime: number;
  slaComplianceRate: number;
}

export function useSLAData() {
  const queryClient = useQueryClient();
  const today = startOfToday().toISOString();
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  // 1. Fetch Waiting Messages (Unresponded today)
  const unrespondedQuery = useQuery({
    queryKey: ['sla-unresponded'],
    queryFn: async () => {
      console.log('useSLAData: Fetching unresponded messages');
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          customer:customers(id, company_name),
          user:users(id, full_name)
        `)
        .eq('type', 'zalo')
        .is('response_time_minutes', null)
        .gte('activity_at', today)
        .order('activity_at', { ascending: true });

      if (error) throw error;
      return data as (SLAActivity & { customer: { company_name: string, id: string }, user: { full_name: string, id: string }})[];
    },
    refetchInterval: 60000, // Fallback poll every minute
  });

  // 2. Fetch SLA Stats
  const statsQuery = useQuery<SLAStats>({
    queryKey: ['sla-stats'],
    queryFn: async () => {
      console.log('useSLAData: Fetching SLA stats');
      // Total activities today
      const { data: allToday, error: allErr } = await supabase
        .from('activities')
        .select('id, response_time_minutes, is_sla_violation')
        .gte('activity_at', today);

      if (allErr) throw allErr;

      const waitingCount = allToday.filter(a => a.response_time_minutes === null).length;
      const violationsToday = allToday.filter(a => a.is_sla_violation === true).length;
      
      const responded = allToday.filter(a => a.response_time_minutes !== null);
      const avgResponseTime = responded.length > 0 
        ? responded.reduce((sum, a) => sum + (a.response_time_minutes || 0), 0) / responded.length 
        : 0;

      const slaComplianceRate = allToday.length > 0 
        ? ((allToday.length - violationsToday) / allToday.length) * 100 
        : 100;

      return {
        waitingCount,
        violationsToday,
        avgResponseTime,
        slaComplianceRate
      };
    }
  });

  // 3. Fetch Violation History (Last 7 days)
  const historyQuery = useQuery({
    queryKey: ['sla-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          customer:customers(id, company_name),
          user:users(id, full_name)
        `)
        .eq('is_sla_violation', true)
        .gte('activity_at', sevenDaysAgo)
        .order('activity_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // 4. Mark as processed Mutation
  const processMutation = useMutation({
    mutationFn: async (activityId: string) => {
      // Get the activity first to calculate time
      const { data: activity } = await supabase
        .from('activities')
        .select('activity_at')
        .eq('id', activityId)
        .single();

      if (!activity) throw new Error('Activity not found');

      const minutes = differenceInMinutes(new Date(), parseISO(activity.activity_at));
      const isViolation = minutes > 30;

      const { error } = await supabase
        .from('activities')
        .update({
          response_time_minutes: minutes,
          is_sla_violation: isViolation
        })
        .eq('id', activityId);

      if (error) throw error;
      return { minutes, isViolation };
    },
    onSuccess: (data) => {
      // Invalidate all SLA queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['sla-unresponded'] });
      queryClient.invalidateQueries({ queryKey: ['sla-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sla-history'] });
      
      if (data.isViolation) {
        toast.warning(`SLA Violated: Response time ${data.minutes}m`);
      } else {
        toast.success(`SLA Passed: Response time ${data.minutes}m`);
      }
    },
    onError: (error) => {
      toast.error(`Error processing SLA message: ${error.message}`);
    }
  });

  // 5. Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('sla-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => {
          console.log('Realtime change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['sla-unresponded'] });
          queryClient.invalidateQueries({ queryKey: ['sla-stats'] });
          queryClient.invalidateQueries({ queryKey: ['sla-history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    unrespondedMessages: unrespondedQuery.data || [],
    isLoading: unrespondedQuery.isLoading || statsQuery.isLoading,
    isError: unrespondedQuery.isError || statsQuery.isError,
    error: unrespondedQuery.error || statsQuery.error,
    stats: statsQuery.data,
    history: historyQuery.data || [],
    processMessage: processMutation.mutate,
    isProcessing: processMutation.isPending
  };
}
