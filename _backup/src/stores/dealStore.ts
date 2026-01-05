import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import toast from 'react-hot-toast';

export interface Deal {
  id: string;
  organization_id: string;
  customer_id: string;
  quote_id?: string;
  assigned_to?: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  title: string;
  description?: string;
  value: number;
  currency: string;
  probability: number;
  weighted_value: number;
  expected_close_date?: string;
  actual_close_date?: string;
  source: string;
  revenue_type: 'one_time' | 'recurring';
  recurring_interval?: 'monthly' | 'quarterly' | 'annual';
  products?: any[];
  tags?: string[];
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customers?: any;
  user_profiles?: any;
}

export interface PipelineStats {
  total_pipeline: number;
  weighted_pipeline: number;
  open_deals_count: number;
  won_deals_count: number;
  lost_deals_count: number;
  total_won_value: number;
  by_stage: {
    lead: { count: number; value: number; weighted: number };
    qualified: { count: number; value: number; weighted: number };
    proposal: { count: number; value: number; weighted: number };
    negotiation: { count: number; value: number; weighted: number };
  };
}

interface DealStore {
  deals: Deal[];
  pipelineStats: PipelineStats | null;
  loading: boolean;
  error: string | null;

  fetchDeals: () => Promise<void>;
  fetchDealById: (id: string) => Promise<Deal | null>;
  fetchPipelineStats: () => Promise<void>;
  createDeal: (deal: Partial<Deal>) => Promise<Deal>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  moveDealToStage: (id: string, stage: Deal['stage']) => Promise<void>;
  convertQuoteToDeal: (quoteId: string, dealData: Partial<Deal>) => Promise<Deal>;
  closeDealAsWon: (id: string) => Promise<void>;
  closeDealAsLost: (id: string, reason?: string) => Promise<void>;
}

export const useDealStore = create<DealStore>((set, get) => ({
  deals: [],
  pipelineStats: null,
  loading: false,
  error: null,

  fetchDeals: async () => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) return;

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('pipeline_items')
        .select(`
          *,
          customers (
            id,
            name,
            first_name,
            last_name,
            company,
            email,
            phone
          ),
          user_profiles:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ deals: data as Deal[], loading: false });
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      set({ error: error.message, loading: false });
      toast.error('Failed to load deals');
    }
  },

  fetchDealById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_items')
        .select(`
          *,
          customers (
            id,
            name,
            first_name,
            last_name,
            company,
            email,
            phone,
            address,
            city,
            state,
            country
          ),
          user_profiles:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Deal;
    } catch (error: any) {
      console.error('Error fetching deal:', error);
      toast.error('Failed to load deal');
      return null;
    }
  },

  fetchPipelineStats: async () => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) return;

    // Handle demo mode
    if (typeof window !== 'undefined' && localStorage.getItem('DEMO_MODE') === 'true') {
      try {
        const quotes = JSON.parse(localStorage.getItem('cxtrack_demo_quotes') || '[]');
        const invoices = JSON.parse(localStorage.getItem('cxtrack_demo_invoices') || '[]');

        // Calculate pipeline from open quotes (sent/viewed status)
        const openQuotes = quotes.filter((q: any) =>
          q.status === 'sent' || q.status === 'viewed' || q.status === 'draft'
        );

        const totalPipeline = openQuotes.reduce((sum: number, q: any) =>
          sum + (q.total_amount || 0), 0
        );

        // Weighted pipeline (assuming 50% probability for open quotes)
        const weightedPipeline = openQuotes.reduce((sum: number, q: any) =>
          sum + (q.total_amount || 0) * 0.5, 0
        );

        // Calculate won deals from paid invoices
        const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
        const totalWonValue = paidInvoices.reduce((sum: number, i: any) =>
          sum + (i.total_amount || 0), 0
        );

        const stats: PipelineStats = {
          total_pipeline: totalPipeline,
          weighted_pipeline: weightedPipeline,
          open_deals_count: openQuotes.length,
          won_deals_count: paidInvoices.length,
          lost_deals_count: 0,
          total_won_value: totalWonValue,
          by_stage: {
            lead: { count: 0, value: 0, weighted: 0 },
            qualified: { count: 0, value: 0, weighted: 0 },
            proposal: { count: openQuotes.length, value: totalPipeline, weighted: weightedPipeline },
            negotiation: { count: 0, value: 0, weighted: 0 },
          },
        };

        set({ pipelineStats: stats });
        return;
      } catch (error: any) {
        console.error('Error calculating demo pipeline stats:', error);
      }
      return;
    }

    try {
      const { data, error } = await supabase.rpc('calculate_pipeline_value', {
        p_organization_id: currentOrg.id,
      });

      if (error) throw error;

      set({ pipelineStats: data as PipelineStats });
    } catch (error: any) {
      console.error('Error fetching pipeline stats:', error);
      toast.error('Failed to load pipeline statistics');
    }
  },

  createDeal: async (dealData: Partial<Deal>) => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) throw new Error('No organization selected');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      const newDeal = {
        organization_id: currentOrg.id,
        created_by: user.id,
        assigned_to: dealData.assigned_to || user.id,
        customer_id: dealData.customer_id,
        title: dealData.title,
        description: dealData.description,
        value: dealData.value || 0,
        currency: dealData.currency || 'USD',
        stage: dealData.stage || 'lead',
        probability: dealData.probability ?? getDefaultProbability(dealData.stage || 'lead'),
        expected_close_date: dealData.expected_close_date,
        source: dealData.source || 'other',
        revenue_type: dealData.revenue_type || 'one_time',
        recurring_interval: dealData.recurring_interval,
        products: dealData.products || [],
        tags: dealData.tags || [],
        metadata: dealData.metadata || {},
        quote_id: dealData.quote_id,
      };

      const { data, error } = await supabase
        .from('pipeline_items')
        .insert([newDeal])
        .select()
        .single();

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal created successfully');

      return data as Deal;
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
      throw error;
    }
  },

  updateDeal: async (id: string, updates: Partial<Deal>) => {
    try {
      const updateData: any = { ...updates };

      if (updates.stage) {
        updateData.probability = updates.probability ?? getDefaultProbability(updates.stage);
      }

      const { error } = await supabase
        .from('pipeline_items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal updated successfully');
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal');
      throw error;
    }
  },

  deleteDeal: async (id: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal deleted successfully');
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
      throw error;
    }
  },

  moveDealToStage: async (id: string, stage: Deal['stage']) => {
    try {
      const probability = getDefaultProbability(stage);

      const updates: any = {
        stage,
        probability,
      };

      if (stage === 'closed_won' || stage === 'closed_lost') {
        updates.actual_close_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('pipeline_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success(`Deal moved to ${formatStageName(stage)}`);
    } catch (error: any) {
      console.error('Error moving deal:', error);
      toast.error('Failed to move deal');
      throw error;
    }
  },

  convertQuoteToDeal: async (quoteId: string, dealData: Partial<Deal>) => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) throw new Error('No organization selected');

    try {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newDeal = {
        organization_id: currentOrg.id,
        created_by: user.id,
        assigned_to: dealData.assigned_to || user.id,
        customer_id: quote.customer_id,
        quote_id: quoteId,
        title: dealData.title || `Deal from Quote ${quote.quote_number}`,
        description: dealData.description,
        value: quote.total_amount,
        currency: quote.currency || 'USD',
        stage: 'proposal',
        probability: 50,
        expected_close_date: dealData.expected_close_date,
        source: 'quote',
        revenue_type: dealData.revenue_type || 'one_time',
        recurring_interval: dealData.recurring_interval,
        products: dealData.products || [],
        tags: dealData.tags || [],
      };

      const { data: deal, error: dealError } = await supabase
        .from('pipeline_items')
        .insert([newDeal])
        .select()
        .single();

      if (dealError) throw dealError;

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          deal_id: deal.id,
          converted_to_deal: true,
          converted_deal_date: new Date().toISOString(),
          status: 'converted',
        })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Quote converted to deal successfully');

      return deal as Deal;
    } catch (error: any) {
      console.error('Error converting quote to deal:', error);
      toast.error('Failed to convert quote to deal');
      throw error;
    }
  },

  closeDealAsWon: async (id: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_items')
        .update({
          stage: 'closed_won',
          probability: 100,
          actual_close_date: new Date().toISOString().split('T')[0],
          final_status: 'Sale',
        })
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal closed as won!');
    } catch (error: any) {
      console.error('Error closing deal as won:', error);
      toast.error('Failed to close deal');
      throw error;
    }
  },

  closeDealAsLost: async (id: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_items')
        .update({
          stage: 'closed_lost',
          probability: 0,
          actual_close_date: new Date().toISOString().split('T')[0],
          final_status: 'No Sale',
          lost_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal closed as lost');
    } catch (error: any) {
      console.error('Error closing deal as lost:', error);
      toast.error('Failed to close deal');
      throw error;
    }
  },
}));

function getDefaultProbability(stage: Deal['stage']): number {
  const probabilities: Record<Deal['stage'], number> = {
    lead: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    closed_won: 100,
    closed_lost: 0,
  };
  return probabilities[stage];
}

function formatStageName(stage: Deal['stage']): string {
  const names: Record<Deal['stage'], string> = {
    lead: 'Lead',
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    closed_won: 'Closed Won',
    closed_lost: 'Closed Lost',
  };
  return names[stage];
}
