import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import { Lead, Opportunity } from '@/types/database.types';
import { DEMO_MODE } from '@/config/demo.config';
import toast from 'react-hot-toast';

// Demo storage keys
const DEMO_LEADS_KEY = 'cxtrack_demo_leads';
const DEMO_OPPORTUNITIES_KEY = 'cxtrack_demo_opportunities';

const loadDemoLeads = (): Lead[] => {
    try {
        const stored = localStorage.getItem(DEMO_LEADS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const loadDemoOpportunities = (): Opportunity[] => {
    try {
        const stored = localStorage.getItem(DEMO_OPPORTUNITIES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveDemoLeads = (leads: Lead[]) => {
    localStorage.setItem(DEMO_LEADS_KEY, JSON.stringify(leads));
};

const saveDemoOpportunities = (opportunities: Opportunity[]) => {
    localStorage.setItem(DEMO_OPPORTUNITIES_KEY, JSON.stringify(opportunities));
};

interface CRMStore {
    leads: Lead[];
    opportunities: Opportunity[];
    loading: boolean;

    fetchLeads: () => Promise<void>;
    fetchOpportunities: () => Promise<void>;

    createLead: (lead: Partial<Lead>) => Promise<Lead | null>;
    updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;

    createOpportunity: (opp: Partial<Opportunity>) => Promise<Opportunity | null>;
    updateOpportunity: (id: string, updates: Partial<Opportunity>) => Promise<void>;
    deleteOpportunity: (id: string) => Promise<void>;

    convertLeadToOpportunity: (leadId: string, appointmentDate: Date) => Promise<void>;
    markOpportunityWon: (oppId: string) => Promise<void>;
    markOpportunityLost: (oppId: string, reason: string) => Promise<void>;
}

export const useCRMStore = create<CRMStore>((set, get) => ({
    leads: DEMO_MODE ? loadDemoLeads() : [],
    opportunities: DEMO_MODE ? loadDemoOpportunities() : [],
    loading: false,

    fetchLeads: async () => {
        if (DEMO_MODE) {
            const leads = loadDemoLeads();
            set({ leads, loading: false });
            return;
        }

        const currentOrg = useOrganizationStore.getState().currentOrganization;
        if (!currentOrg) return;

        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ leads: data as Lead[], loading: false });
        } catch (error: any) {
            console.error('Error fetching leads:', error);
            toast.error('Failed to load leads');
            set({ loading: false });
        }
    },

    fetchOpportunities: async () => {
        if (DEMO_MODE) {
            const opportunities = loadDemoOpportunities();
            set({ opportunities, loading: false });
            return;
        }

        const currentOrg = useOrganizationStore.getState().currentOrganization;
        if (!currentOrg) return;

        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('opportunities')
                .select(`
          *,
          leads (name, company),
          customers (name, company)
        `)
                .eq('organization_id', currentOrg.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ opportunities: data as any[], loading: false });
        } catch (error: any) {
            console.error('Error fetching opportunities:', error);
            toast.error('Failed to load opportunities');
            set({ loading: false });
        }
    },

    createLead: async (leadData) => {
        const currentOrg = useOrganizationStore.getState().currentOrganization;
        if (!currentOrg) return null;

        try {
            // Set default probability based on status
            let probability = 0.1;
            if (leadData.status === 'contacted') probability = 0.15;
            if (leadData.status === 'nurturing') probability = 0.20;
            if (leadData.status === 'qualified') probability = 0.30;

            const { data, error } = await supabase
                .from('leads')
                .insert({
                    ...leadData,
                    organization_id: currentOrg.id,
                    probability
                })
                .select()
                .single();

            if (error) throw error;

            set(state => ({ leads: [data as Lead, ...state.leads] }));
            toast.success('Lead created successfully');
            return data as Lead;
        } catch (error: any) {
            console.error('Error creating lead:', error);
            toast.error('Failed to create lead');
            return null;
        }
    },

    updateLead: async (id, updates) => {
        try {
            // Recalculate probability if status changes
            if (updates.status) {
                if (updates.status === 'new') updates.probability = 0.10;
                if (updates.status === 'contacted') updates.probability = 0.15;
                if (updates.status === 'nurturing') updates.probability = 0.20;
                if (updates.status === 'qualified') updates.probability = 0.30;
                if (updates.status === 'dead') updates.probability = 0.0;
            }

            const { error } = await supabase
                .from('leads')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                leads: state.leads.map(l => l.id === id ? { ...l, ...updates } : l)
            }));
            toast.success('Lead updated');
        } catch (error: any) {
            console.error('Error updating lead:', error);
            toast.error('Failed to update lead');
        }
    },

    deleteLead: async (id) => {
        try {
            const { error } = await supabase.from('leads').delete().eq('id', id);
            if (error) throw error;

            set(state => ({ leads: state.leads.filter(l => l.id !== id) }));
            toast.success('Lead deleted');
        } catch (error: any) {
            console.error('Error deleting lead:', error);
            toast.error('Failed to delete lead');
        }
    },

    createOpportunity: async (oppData) => {
        const currentOrg = useOrganizationStore.getState().currentOrganization;
        if (!currentOrg) return null;

        try {
            // Set default probability based on stage
            let probability = 0.40;
            if (oppData.stage === 'demo_scheduled') probability = 0.50;
            if (oppData.stage === 'proposal') probability = 0.60;
            if (oppData.stage === 'negotiation') probability = 0.75;
            if (oppData.stage === 'won') probability = 1.0;
            if (oppData.stage === 'lost') probability = 0.0;

            const { data, error } = await supabase
                .from('opportunities')
                .insert({
                    ...oppData,
                    organization_id: currentOrg.id,
                    probability
                })
                .select()
                .single();

            if (error) throw error;

            set(state => ({ opportunities: [data as Opportunity, ...state.opportunities] }));
            toast.success('Opportunity created');
            return data as Opportunity;
        } catch (error: any) {
            console.error('Error creating opportunity:', error);
            toast.error('Failed to create opportunity');
            return null;
        }
    },

    updateOpportunity: async (id, updates) => {
        try {
            // Recalculate probability if stage changes
            if (updates.stage) {
                if (updates.stage === 'discovery') updates.probability = 0.40;
                if (updates.stage === 'demo_scheduled') updates.probability = 0.50;
                if (updates.stage === 'proposal') updates.probability = 0.60;
                if (updates.stage === 'negotiation') updates.probability = 0.75;
                if (updates.stage === 'won') updates.probability = 1.0;
                if (updates.stage === 'lost') updates.probability = 0.0;
            }

            const { error } = await supabase
                .from('opportunities')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                opportunities: state.opportunities.map(o => o.id === id ? { ...o, ...updates } : o)
            }));
            toast.success('Opportunity updated');
        } catch (error: any) {
            console.error('Error updating opportunity:', error);
            toast.error('Failed to update opportunity');
        }
    },

    deleteOpportunity: async (id) => {
        try {
            const { error } = await supabase.from('opportunities').delete().eq('id', id);
            if (error) throw error;

            set(state => ({ opportunities: state.opportunities.filter(o => o.id !== id) }));
            toast.success('Opportunity deleted');
        } catch (error: any) {
            console.error('Error deleting opportunity:', error);
            toast.error('Failed to delete opportunity');
        }
    },

    convertLeadToOpportunity: async (leadId, appointmentDate) => {
        try {
            const lead = get().leads.find(l => l.id === leadId);
            if (!lead) throw new Error('Lead not found');

            const currentOrg = useOrganizationStore.getState().currentOrganization;
            if (!currentOrg) return;

            // 1. Create Opportunity
            const { data: opp, error: oppError } = await supabase
                .from('opportunities')
                .insert({
                    organization_id: currentOrg.id,
                    lead_id: leadId,
                    name: `${lead.company ? lead.company + ' - ' : ''}${lead.name}`,
                    description: lead.notes,
                    stage: 'discovery',
                    value: lead.potential_value,
                    probability: 0.40,
                    appointment_date: appointmentDate.toISOString(),
                    expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    assigned_to: lead.assigned_to
                })
                .select()
                .single();

            if (oppError) throw oppError;

            // 2. Update Lead
            await get().updateLead(leadId, {
                status: 'qualified',
                converted_to_opportunity_id: opp.id
            });

            // 3. Add to store
            set(state => ({ opportunities: [opp as Opportunity, ...state.opportunities] }));

            toast.success('Lead converted to Opportunity!');
        } catch (error: any) {
            console.error('Error converting lead:', error);
            toast.error('Failed to convert lead');
        }
    },

    markOpportunityWon: async (oppId) => {
        try {
            const opp = get().opportunities.find(o => o.id === oppId);
            if (!opp) return;

            // 1. Create Invoice (Draft)
            // Logic handled via database triggers or separate call? 
            // Plan said: "Create invoice". Let's do it manually here for full control.

            const { data: invoice, error: invError } = await supabase
                .from('invoices')
                .insert({
                    organization_id: opp.organization_id,
                    customer_id: opp.customer_id, // needs to exist!
                    opportunity_id: oppId,
                    // quote_id: opp.quote_id, // if linked
                    total_amount: opp.value,
                    status: 'Draft',
                    date: new Date().toISOString(),
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    // items? empty for now or copy from quote if exists
                })
                .select()
                .single();

            if (invError) {
                console.warn('Could not create invoice automatically (maybe no customer_id?)', invError);
                // Don't fail the whole won process, just warn
            }

            // 2. Update Opportunity
            await get().updateOpportunity(oppId, {
                stage: 'won',
                probability: 1.0,
                actual_close_date: new Date().toISOString(),
                invoice_id: invoice?.id
            });

            toast.success('Opportunity marked Won!');
        } catch (error: any) {
            console.error('Error marking won:', error);
            toast.error('Failed to mark won');
        }
    },

    markOpportunityLost: async (oppId, reason) => {
        await get().updateOpportunity(oppId, {
            stage: 'lost',
            probability: 0.0,
            actual_close_date: new Date().toISOString(),
            lost_reason: reason
        });
    }

}));
