import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '@/config/demo.config';

export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price_monthly: number;      // in cents
    price_yearly?: number;      // in cents
    included_minutes: number;
    overage_rate_cents: number; // cents per minute over limit
    features: string[];
    is_active: boolean;
    is_default: boolean;
    is_popular?: boolean;
    stripe_price_id_monthly?: string;
    stripe_price_id_yearly?: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface PlanStore {
    plans: SubscriptionPlan[];
    loading: boolean;
    error: string | null;

    fetchPlans: () => Promise<void>;
    createPlan: (data: Partial<SubscriptionPlan>) => Promise<SubscriptionPlan>;
    updatePlan: (id: string, data: Partial<SubscriptionPlan>) => Promise<SubscriptionPlan>;
    deletePlan: (id: string) => Promise<void>;
    reorderPlans: (planIds: string[]) => Promise<void>;

    getActivePlans: () => SubscriptionPlan[];
    getDefaultPlan: () => SubscriptionPlan | undefined;
    getPlanById: (id: string) => SubscriptionPlan | undefined;
}

// Default plans to seed
const DEFAULT_PLANS: SubscriptionPlan[] = [
    {
        id: 'plan_free_trial',
        name: 'Free Trial',
        slug: 'free-trial',
        description: '1 month free to experience the AI Voice Agent',
        price_monthly: 0,
        included_minutes: 50,
        overage_rate_cents: 0,
        features: [
            'AI Voice Agent',
            'Basic CRM Access',
            '50 Minutes Included',
            'Email Support',
            '40+ Languages',
        ],
        is_active: true,
        is_default: true,
        is_popular: false,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'plan_standard',
        name: 'Standard',
        slug: 'standard',
        description: 'Perfect for small businesses',
        price_monthly: 15000, // $150
        price_yearly: 144000, // $1440 (2 months free)
        included_minutes: 100,
        overage_rate_cents: 12,
        features: [
            'AI Voice Agent',
            'Full CRM Access',
            '100 Minutes Included',
            '$0.12/min overage',
            'Priority Email Support',
            '40+ Languages',
            'Call Analytics',
            'SMS Notifications',
        ],
        is_active: true,
        is_default: false,
        is_popular: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'plan_pro',
        name: 'Pro',
        slug: 'pro',
        description: 'For growing teams with high call volume',
        price_monthly: 29900, // $299
        price_yearly: 287040, // $2870.40 (2 months free)
        included_minutes: 500,
        overage_rate_cents: 8,
        features: [
            'Everything in Standard',
            '500 Minutes Included',
            '$0.08/min overage',
            'Phone Support',
            'Custom Integrations',
            'Advanced Analytics',
            'Team Management',
            'API Access',
        ],
        is_active: true,
        is_default: false,
        is_popular: false,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'plan_enterprise',
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Custom solutions for large organizations',
        price_monthly: 0, // Custom pricing
        included_minutes: 9999, // Unlimited
        overage_rate_cents: 5,
        features: [
            'Everything in Pro',
            'Unlimited Minutes',
            'Dedicated Account Manager',
            'Custom SLA',
            'White-label Options',
            'On-premise Deployment',
            'Custom Integrations',
            '24/7 Phone Support',
        ],
        is_active: true,
        is_default: false,
        is_popular: false,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export const usePlanStore = create<PlanStore>((set, get) => ({
    plans: [],
    loading: false,
    error: null,

    fetchPlans: async () => {
        console.log('📋 Fetching subscription plans...');
        set({ loading: true, error: null });

        try {
            if (DEMO_MODE) {
                let plans = loadDemoData<SubscriptionPlan>(DEMO_STORAGE_KEYS.plans);
                if (!plans || plans.length === 0) {
                    plans = DEFAULT_PLANS;
                    saveDemoData(DEMO_STORAGE_KEYS.plans, plans);
                }
                console.log('✅ Loaded demo plans:', plans.length);
                set({ plans, loading: false });
                return;
            }

            // PRODUCTION MODE
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            set({ plans: data || [], loading: false });
        } catch (error: any) {
            console.error('❌ Error fetching plans:', error);
            set({ error: error.message, loading: false });
        }
    },

    createPlan: async (data) => {
        console.log('📋 Creating plan:', data);
        set({ loading: true, error: null });

        try {
            if (DEMO_MODE) {
                const newPlan: SubscriptionPlan = {
                    id: generateDemoId('plan'),
                    name: data.name || 'New Plan',
                    slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || 'new-plan',
                    description: data.description,
                    price_monthly: data.price_monthly || 0,
                    price_yearly: data.price_yearly,
                    included_minutes: data.included_minutes || 50,
                    overage_rate_cents: data.overage_rate_cents || 10,
                    features: data.features || [],
                    is_active: data.is_active ?? true,
                    is_default: data.is_default ?? false,
                    is_popular: data.is_popular ?? false,
                    stripe_price_id_monthly: data.stripe_price_id_monthly,
                    stripe_price_id_yearly: data.stripe_price_id_yearly,
                    sort_order: get().plans.length,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                const plans = [...get().plans, newPlan];
                saveDemoData(DEMO_STORAGE_KEYS.plans, plans);
                set({ plans, loading: false });

                console.log('✅ Plan created (demo):', newPlan);
                return newPlan;
            }

            // PRODUCTION MODE
            const { data: planData, error } = await supabase
                .from('subscription_plans')
                .insert({
                    ...data,
                    slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'),
                })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                plans: [...state.plans, planData],
                loading: false,
            }));

            return planData;
        } catch (error: any) {
            console.error('❌ Error creating plan:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updatePlan: async (id, data) => {
        console.log('📋 Updating plan:', id, data);

        try {
            if (DEMO_MODE) {
                // If setting as default, unset others
                let updatedPlans = get().plans;
                if (data.is_default) {
                    updatedPlans = updatedPlans.map(p => ({ ...p, is_default: false }));
                }

                updatedPlans = updatedPlans.map(p =>
                    p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
                );

                saveDemoData(DEMO_STORAGE_KEYS.plans, updatedPlans);
                set({ plans: updatedPlans });

                const updated = updatedPlans.find(p => p.id === id)!;
                console.log('✅ Plan updated (demo):', updated);
                return updated;
            }

            // PRODUCTION MODE
            const { data: planData, error } = await supabase
                .from('subscription_plans')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                plans: state.plans.map(p => p.id === id ? planData : p),
            }));

            return planData;
        } catch (error: any) {
            console.error('❌ Error updating plan:', error);
            throw error;
        }
    },

    deletePlan: async (id) => {
        console.log('📋 Deleting plan:', id);

        try {
            if (DEMO_MODE) {
                const plans = get().plans.filter(p => p.id !== id);
                saveDemoData(DEMO_STORAGE_KEYS.plans, plans);
                set({ plans });
                console.log('✅ Plan deleted (demo)');
                return;
            }

            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                plans: state.plans.filter(p => p.id !== id),
            }));
        } catch (error: any) {
            console.error('❌ Error deleting plan:', error);
            throw error;
        }
    },

    reorderPlans: async (planIds) => {
        console.log('📋 Reordering plans:', planIds);

        try {
            const updatedPlans = planIds.map((id, index) => {
                const plan = get().plans.find(p => p.id === id);
                return plan ? { ...plan, sort_order: index } : null;
            }).filter(Boolean) as SubscriptionPlan[];

            if (DEMO_MODE) {
                saveDemoData(DEMO_STORAGE_KEYS.plans, updatedPlans);
                set({ plans: updatedPlans });
                return;
            }

            // PRODUCTION: Update each plan's sort_order
            for (const plan of updatedPlans) {
                await supabase
                    .from('subscription_plans')
                    .update({ sort_order: plan.sort_order })
                    .eq('id', plan.id);
            }

            set({ plans: updatedPlans });
        } catch (error: any) {
            console.error('❌ Error reordering plans:', error);
            throw error;
        }
    },

    getActivePlans: () => {
        return get().plans.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
    },

    getDefaultPlan: () => {
        return get().plans.find(p => p.is_default);
    },

    getPlanById: (id) => {
        return get().plans.find(p => p.id === id);
    },
}));
