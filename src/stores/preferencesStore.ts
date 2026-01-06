import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { DEMO_MODE, DEMO_STORAGE_KEYS } from '@/config/demo.config';
import toast from 'react-hot-toast';

interface UserPreferences {
    sidebarOrder: string[];
    dashboardLayout: any[];
    quickActionsOrder: string[];
    mobileNavItems: string[];
}

interface PreferencesStore {
    preferences: UserPreferences;
    isLoading: boolean;
    loadPreferences: () => Promise<void>;
    saveSidebarOrder: (order: string[]) => Promise<void>;
    saveDashboardLayout: (layout: any[]) => Promise<void>;
    saveQuickActionsOrder: (order: string[]) => Promise<void>;
    saveMobileNavItems: (items: string[]) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
    preferences: {
        sidebarOrder: ['customers', 'calendar', 'products', 'quotes', 'invoices', 'calls', 'pipeline', 'tasks'],
        dashboardLayout: [],
        quickActionsOrder: ['add-customer', 'schedule', 'create-quote', 'new-invoice', 'create-task'],
        mobileNavItems: ['/customers', '/calendar', '/products'], // Default custom mobile nav slots
    },
    isLoading: false,

    loadPreferences: async () => {
        try {
            set({ isLoading: true });

            if (DEMO_MODE) {
                const stored = localStorage.getItem(DEMO_STORAGE_KEYS.preferences);
                if (stored) {
                    try {
                        const savedPrefs = JSON.parse(stored);
                        set(state => ({
                            preferences: { ...state.preferences, ...savedPrefs },
                            isLoading: false
                        }));
                    } catch (e) {
                        console.error('Failed to parse demo preferences', e);
                        set({ isLoading: false });
                    }
                } else {
                    set({ isLoading: false });
                }
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isLoading: false });
                return;
            }

            const orgId = localStorage.getItem('current_organization_id');
            if (!orgId) {
                set({ isLoading: false });
                return;
            }

            const { data: prefs, error } = await supabase
                .from('user_preferences')
                .select('preference_type, preference_value')
                .eq('user_id', user.id)
                .eq('organization_id', orgId);

            if (error) throw error;

            if (prefs) {
                const newPreferences = { ...get().preferences };
                prefs.forEach((p: any) => {
                    if (p.preference_type === 'sidebar_order') newPreferences.sidebarOrder = p.preference_value;
                    if (p.preference_type === 'dashboard_layout') newPreferences.dashboardLayout = p.preference_value;
                    if (p.preference_type === 'quick_actions_order') newPreferences.quickActionsOrder = p.preference_value;
                    if (p.preference_type === 'mobile_nav_items') newPreferences.mobileNavItems = p.preference_value;
                });
                set({ preferences: newPreferences });
            }

            set({ isLoading: false });
        } catch (error) {
            console.error('Error loading preferences:', error);
            set({ isLoading: false });
        }
    },

    saveSidebarOrder: async (order: string[]) => {
        try {
            if (DEMO_MODE) {
                const newPrefs = { ...get().preferences, sidebarOrder: order };
                set({ preferences: newPrefs });
                localStorage.setItem(DEMO_STORAGE_KEYS.preferences, JSON.stringify(newPrefs));
                toast.success('Navigation order saved (Demo)');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const orgId = localStorage.getItem('current_organization_id');
            if (!orgId) return;

            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: orgId,
                    preference_type: 'sidebar_order',
                    preference_value: order,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id,preference_type'
                });

            set(state => ({
                preferences: { ...state.preferences, sidebarOrder: order }
            }));
            toast.success('Navigation order saved');
        } catch (error) {
            console.error('Error saving sidebar order:', error);
            toast.error('Failed to save navigation order');
        }
    },

    saveDashboardLayout: async (layout: any[]) => {
        try {
            if (DEMO_MODE) {
                const newPrefs = { ...get().preferences, dashboardLayout: layout };
                set({ preferences: newPrefs });
                localStorage.setItem(DEMO_STORAGE_KEYS.preferences, JSON.stringify(newPrefs));
                toast.success('Dashboard layout saved (Demo)');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const orgId = localStorage.getItem('current_organization_id');
            if (!orgId) return;

            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: orgId,
                    preference_type: 'dashboard_layout',
                    preference_value: layout,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id,preference_type'
                });

            set(state => ({
                preferences: { ...state.preferences, dashboardLayout: layout }
            }));
            toast.success('Dashboard layout saved');
        } catch (error) {
            console.error('Error saving dashboard layout:', error);
            toast.error('Failed to save dashboard layout');
        }
    },

    saveQuickActionsOrder: async (order: string[]) => {
        try {
            if (DEMO_MODE) {
                const newPrefs = { ...get().preferences, quickActionsOrder: order };
                set({ preferences: newPrefs });
                localStorage.setItem(DEMO_STORAGE_KEYS.preferences, JSON.stringify(newPrefs));
                toast.success('Quick actions updated (Demo)');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const orgId = localStorage.getItem('current_organization_id');
            if (!orgId) return;

            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: orgId,
                    preference_type: 'quick_actions_order',
                    preference_value: order,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id,preference_type'
                });

            set(state => ({
                preferences: { ...state.preferences, quickActionsOrder: order }
            }));
            toast.success('Quick actions updated');
        } catch (error) {
            console.error('Error saving quick actions order:', error);
            toast.error('Failed to save quick actions');
        }
    },

    saveMobileNavItems: async (items: string[]) => {
        try {
            if (DEMO_MODE) {
                const newPrefs = { ...get().preferences, mobileNavItems: items };
                set({ preferences: newPrefs });
                localStorage.setItem(DEMO_STORAGE_KEYS.preferences, JSON.stringify(newPrefs));
                toast.success('Mobile navigation updated (Demo)');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const orgId = localStorage.getItem('current_organization_id');
            if (!orgId) return;

            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: orgId,
                    preference_type: 'mobile_nav_items',
                    preference_value: items,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id,preference_type'
                });

            set(state => ({
                preferences: { ...state.preferences, mobileNavItems: items }
            }));
            toast.success('Mobile navigation updated');
        } catch (error) {
            console.error('Error saving mobile nav items:', error);
            toast.error('Failed to update mobile navigation');
        }
    },
}));
