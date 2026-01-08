import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '@/config/demo.config';
import { MOCK_ADMIN_USER } from '@/contexts/AuthContext';

export type AgentTone = 'professional' | 'friendly' | 'casual' | 'formal';
export type HandlingPreference = 'handle_automatically' | 'notify_team' | 'transfer_immediately';
export type FallbackBehavior = 'transfer_to_voicemail' | 'take_message' | 'schedule_callback' | 'transfer_to_human';

export interface VoiceAgentConfig {
    id: string;
    organization_id: string;

    // Basic Info
    agent_name: string;
    agent_tone: AgentTone;

    // Business Context
    business_name: string;
    industry: string;
    business_description: string;

    // Call Handling
    common_call_reasons: string[];
    handling_preference: HandlingPreference;
    greeting_script: string;
    fallback_behavior: FallbackBehavior;

    // Advanced
    languages: string[];
    working_hours?: {
        timezone: string;
        schedule: Record<string, { start: string; end: string; enabled: boolean }>;
    };

    // Status
    is_active: boolean;
    setup_completed: boolean;
    setup_step: number; // 0-3 for wizard progress

    created_at: string;
    updated_at: string;
}

export interface VoiceUsage {
    id: string;
    organization_id: string;
    billing_period_start: string;
    billing_period_end: string;
    minutes_used: number;
    minutes_included: number;
    overage_minutes: number;
    overage_cost_cents: number;
}

interface VoiceAgentStore {
    config: VoiceAgentConfig | null;
    usage: VoiceUsage | null;
    loading: boolean;
    error: string | null;

    fetchConfig: () => Promise<void>;
    saveConfig: (data: Partial<VoiceAgentConfig>) => Promise<VoiceAgentConfig>;
    updateSetupStep: (step: number) => Promise<void>;
    activateAgent: () => Promise<void>;
    deactivateAgent: () => Promise<void>;

    fetchUsage: () => Promise<void>;

    getSetupProgress: () => number;
    isSetupComplete: () => boolean;
}

const DEFAULT_CONFIG: Omit<VoiceAgentConfig, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
    agent_name: 'AI Assistant',
    agent_tone: 'professional',
    business_name: '',
    industry: '',
    business_description: '',
    common_call_reasons: [],
    handling_preference: 'handle_automatically',
    greeting_script: "Hello! Thank you for calling {business_name}. How can I help you today?",
    fallback_behavior: 'take_message',
    languages: ['English'],
    is_active: false,
    setup_completed: false,
    setup_step: 0,
};

const INDUSTRY_OPTIONS = [
    'Software / SaaS',
    'Real Estate',
    'Healthcare',
    'Legal Services',
    'Accounting / Finance',
    'Consulting',
    'Home Services',
    'Retail / E-commerce',
    'Non-Profit',
];

const TONE_DESCRIPTIONS: Record<AgentTone, string> = {
    professional: 'Polished and business-like, suitable for B2B and corporate clients',
    friendly: 'Warm and approachable, great for customer service',
    casual: 'Relaxed and conversational, ideal for younger demographics',
    formal: 'Traditional and respectful, appropriate for legal/financial services',
};

export { INDUSTRY_OPTIONS, TONE_DESCRIPTIONS };

export const useVoiceAgentStore = create<VoiceAgentStore>((set, get) => ({
    config: null,
    usage: null,
    loading: false,
    error: null,

    fetchConfig: async () => {
        console.log('🎙️ Fetching voice agent config...');
        set({ loading: true, error: null });

        try {
            if (DEMO_MODE) {
                const configs = loadDemoData<VoiceAgentConfig>(DEMO_STORAGE_KEYS.voice_agent);
                const config = configs?.[0] || null;
                console.log('✅ Loaded demo voice agent config:', config ? 'found' : 'not found');
                set({ config, loading: false });
                return;
            }

            // PRODUCTION MODE
            const { data, error } = await supabase
                .from('voice_agent_config')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

            set({ config: data || null, loading: false });
        } catch (error: any) {
            console.error('❌ Error fetching voice agent config:', error);
            set({ error: error.message, loading: false });
        }
    },

    saveConfig: async (data) => {
        console.log('🎙️ Saving voice agent config:', data);
        set({ loading: true, error: null });

        try {
            const currentConfig = get().config;

            if (DEMO_MODE) {
                const updatedConfig: VoiceAgentConfig = {
                    id: currentConfig?.id || generateDemoId('agent'),
                    organization_id: MOCK_ADMIN_USER.organization_id,
                    ...DEFAULT_CONFIG,
                    ...currentConfig,
                    ...data,
                    updated_at: new Date().toISOString(),
                    created_at: currentConfig?.created_at || new Date().toISOString(),
                };

                saveDemoData(DEMO_STORAGE_KEYS.voice_agent, [updatedConfig]);
                set({ config: updatedConfig, loading: false });

                console.log('✅ Voice agent config saved (demo):', updatedConfig);
                return updatedConfig;
            }

            // PRODUCTION MODE
            if (currentConfig) {
                // Update existing
                const { data: configData, error } = await supabase
                    .from('voice_agent_config')
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', currentConfig.id)
                    .select()
                    .single();

                if (error) throw error;
                set({ config: configData, loading: false });
                return configData;
            } else {
                // Create new
                const { data: configData, error } = await supabase
                    .from('voice_agent_config')
                    .insert({ ...DEFAULT_CONFIG, ...data })
                    .select()
                    .single();

                if (error) throw error;
                set({ config: configData, loading: false });
                return configData;
            }
        } catch (error: any) {
            console.error('❌ Error saving voice agent config:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateSetupStep: async (step) => {
        const currentConfig = get().config;
        await get().saveConfig({
            setup_step: step,
            setup_completed: step >= 3,
        });
    },

    activateAgent: async () => {
        await get().saveConfig({ is_active: true });
    },

    deactivateAgent: async () => {
        await get().saveConfig({ is_active: false });
    },

    fetchUsage: async () => {
        console.log('📊 Fetching voice usage...');

        try {
            if (DEMO_MODE) {
                // Generate demo usage data
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const demoUsage: VoiceUsage = {
                    id: 'usage_demo',
                    organization_id: MOCK_ADMIN_USER.organization_id,
                    billing_period_start: startOfMonth.toISOString(),
                    billing_period_end: endOfMonth.toISOString(),
                    minutes_used: 23.5,
                    minutes_included: 50,
                    overage_minutes: 0,
                    overage_cost_cents: 0,
                };

                set({ usage: demoUsage });
                return;
            }

            // PRODUCTION MODE
            const { data, error } = await supabase
                .from('voice_usage')
                .select('*')
                .order('billing_period_start', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            set({ usage: data || null });
        } catch (error: any) {
            console.error('❌ Error fetching usage:', error);
        }
    },

    getSetupProgress: () => {
        const config = get().config;
        if (!config) return 0;
        return Math.min((config.setup_step / 3) * 100, 100);
    },

    isSetupComplete: () => {
        const config = get().config;
        return config?.setup_completed ?? false;
    },
}));
