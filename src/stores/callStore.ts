import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Call } from '@/types/database.types';
import { useOrganizationStore } from './organizationStore';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData } from '@/config/demo.config';

interface CallFilters {
  dateRange?: { start: Date; end: Date };
  userIds?: string[];
  agentIds?: string[];
  callType?: 'all' | 'human' | 'ai_agent';
  direction?: 'all' | 'inbound' | 'outbound';
  status?: string[];
  outcome?: string[];
  searchQuery?: string;
}

interface CallStats {
  total_calls: number;
  this_week: number;
  avg_duration_seconds: number;
  connection_rate: number;
  human_calls: number;
  ai_agent_calls: number;
  inbound_calls: number;
  outbound_calls: number;
  positive_outcomes: number;
  neutral_outcomes: number;
  negative_outcomes: number;
}

interface CallStore {
  calls: Call[];
  currentCall: Call | null;
  loading: boolean;
  error: string | null;
  filters: CallFilters;
  stats: CallStats | null;

  fetchCalls: () => Promise<void>;
  fetchCallsByCustomer: (customerId: string) => Promise<void>;
  fetchCallById: (id: string) => Promise<void>;
  fetchCallStats: () => Promise<void>;
  createCall: (call: Partial<Call>) => Promise<Call | null>;
  updateCall: (id: string, updates: Partial<Call>) => Promise<void>;
  deleteCall: (id: string) => Promise<void>;
  setFilters: (filters: Partial<CallFilters>) => void;
  subscribeToLiveCalls: () => () => void;
}

export const useCallStore = create<CallStore>((set, get) => ({
  calls: DEMO_MODE ? loadDemoData<Call>(DEMO_STORAGE_KEYS.calls) : [],
  currentCall: null,
  loading: false,
  error: null,
  filters: {},
  stats: null,

  fetchCalls: async () => {
    if (DEMO_MODE) {
      const calls = loadDemoData<Call>(DEMO_STORAGE_KEYS.calls);
      set({ calls, loading: false });
      return;
    }

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) return;

    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('calls')
        .select('*, customers(first_name, last_name, name, company)')
        .eq('organization_id', organizationId);

      const filters = get().filters;

      if (filters.callType && filters.callType !== 'all') {
        query = query.eq('call_type', filters.callType);
      }

      if (filters.direction && filters.direction !== 'all') {
        query = query.eq('direction', filters.direction);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.outcome && filters.outcome.length > 0) {
        query = query.in('outcome', filters.outcome);
      }

      if (filters.userIds && filters.userIds.length > 0) {
        query = query.in('user_id', filters.userIds);
      }

      if (filters.agentIds && filters.agentIds.length > 0) {
        query = query.in('agent_id', filters.agentIds);
      }

      if (filters.dateRange) {
        query = query
          .gte('started_at', filters.dateRange.start.toISOString())
          .lte('started_at', filters.dateRange.end.toISOString());
      }

      if (filters.searchQuery) {
        query = query.or(`notes.ilike.%${filters.searchQuery}%,summary.ilike.%${filters.searchQuery}%,transcript.ilike.%${filters.searchQuery}%`);
      }

      query = query.order('started_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      set({ calls: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCallsByCustomer: async (customerId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ calls: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCallById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      set({ currentCall: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createCall: async (call: Partial<Call>) => {
    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) return null;

    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('calls')
        .insert({
          ...call,
          organization_id: organizationId,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        calls: [data, ...state.calls],
        loading: false,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateCall: async (id: string, updates: Partial<Call>) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        calls: state.calls.map((c) => (c.id === id ? data : c)),
        currentCall: state.currentCall?.id === id ? data : state.currentCall,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteCall: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        calls: state.calls.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCallStats: async () => {
    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) return;

    try {
      const { data: calls, error } = await supabase
        .from('calls')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: CallStats = {
        total_calls: calls?.length || 0,
        this_week: calls?.filter(c => new Date(c.started_at!) >= weekAgo).length || 0,
        avg_duration_seconds: Math.round(
          (calls?.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) || 0) /
          (calls?.length || 1)
        ),
        connection_rate: calls?.length ?
          calls.filter(c => c.status === 'completed').length / calls.length : 0,
        human_calls: calls?.filter(c => c.call_type === 'human').length || 0,
        ai_agent_calls: calls?.filter(c => c.call_type === 'ai_agent').length || 0,
        inbound_calls: calls?.filter(c => c.direction === 'inbound').length || 0,
        outbound_calls: calls?.filter(c => c.direction === 'outbound').length || 0,
        positive_outcomes: calls?.filter(c => c.outcome === 'positive').length || 0,
        neutral_outcomes: calls?.filter(c => c.outcome === 'neutral').length || 0,
        negative_outcomes: calls?.filter(c => c.outcome === 'negative').length || 0,
      };

      set({ stats });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setFilters: (filters: Partial<CallFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
    get().fetchCalls();
  },

  subscribeToLiveCalls: () => {
    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) return () => { };

    if (!supabase || typeof supabase.channel !== 'function') {
      console.log('Supabase realtime not available, skipping subscription');
      return () => { };
    }

    try {
      const subscription = supabase
        .channel('calls-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'calls',
            filter: `organization_id=eq.${organizationId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              set((state) => ({
                calls: [payload.new as Call, ...state.calls],
              }));
            } else if (payload.eventType === 'UPDATE') {
              set((state) => ({
                calls: state.calls.map((c) =>
                  c.id === payload.new.id ? payload.new as Call : c
                ),
                currentCall: state.currentCall?.id === payload.new.id ?
                  payload.new as Call : state.currentCall,
              }));
            } else if (payload.eventType === 'DELETE') {
              set((state) => ({
                calls: state.calls.filter((c) => c.id !== payload.old.id),
              }));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to calls:', error);
      return () => { };
    }
  },
}));
