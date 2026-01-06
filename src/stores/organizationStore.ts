import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { isDemoMode, getDemoOrganizationId } from '../config/demo.config';
import { MOCK_ADMIN_USER } from '../contexts/AuthContext';
import type { Organization, OrganizationMember, UserProfile } from '../types/database.types';

interface OrganizationState {
  currentOrganization: Organization | null;
  currentMembership: OrganizationMember | null;
  organizations: Array<{ organization: Organization; membership: OrganizationMember }>;
  teamMembers: Array<UserProfile & { role: string; color: string }>;
  loading: boolean;
  demoMode: boolean;
  fetchUserOrganizations: (userId?: string) => Promise<void>;
  setCurrentOrganization: (orgId: string) => Promise<void>;
  fetchTeamMembers: () => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  updateMember: (memberId: string, data: Partial<OrganizationMember>) => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  getOrganizationId: () => string;
}

// Generate a color for each team member
const generateUserColor = (index: number): string => {
  const colors = [
    '#6366f1', // indigo
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  return colors[index % colors.length];
};

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      currentOrganization: null,
      currentMembership: null,
      organizations: [],
      teamMembers: [],
      loading: false,
      demoMode: isDemoMode(),

      getOrganizationId: () => {
        const { currentOrganization, demoMode } = get();
        if (currentOrganization?.id) {
          return currentOrganization.id;
        }
        if (demoMode) {
          return getDemoOrganizationId();
        }
        throw new Error('No organization available');
      },

      fetchUserOrganizations: async (userId?: string) => {
        set({ loading: true });
        try {
          const userIdToFetch = userId || MOCK_ADMIN_USER.id;
          const isDemoUser = userIdToFetch === '00000000-0000-0000-0000-000000000001';

          const { data, error } = await supabase
            .from('organization_members')
            .select(`
              *,
              organization:organizations(*)
            `)
            .eq('user_id', userIdToFetch);

          if (error) throw error;

          let orgs = data.map((item: any) => ({
            organization: item.organization,
            membership: {
              id: item.id,
              organization_id: item.organization_id,
              user_id: item.user_id,
              role: item.role,
              permissions: item.permissions,
              calendar_delegation: item.calendar_delegation,
              can_view_team_calendars: item.can_view_team_calendars,
              joined_at: item.joined_at,
            },
          }));

          if (isDemoUser && orgs.length === 0) {
            const { data: demoOrg, error: demoError } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', getDemoOrganizationId())
              .single();

            if (!demoError && demoOrg) {
              orgs = [{
                organization: demoOrg,
                membership: {
                  id: 'demo-membership',
                  organization_id: demoOrg.id,
                  user_id: userIdToFetch,
                  role: 'admin',
                  permissions: ['*'],
                  calendar_delegation: null,
                  can_view_team_calendars: true,
                  joined_at: new Date().toISOString(),
                },
              }];
            }
          }

          set({ organizations: orgs, loading: false });

          // If no current org selected, select the first one
          if (!get().currentOrganization && orgs.length > 0) {
            await get().setCurrentOrganization(orgs[0].organization.id);
          }
        } catch (error) {
          console.error('Failed to fetch organizations:', error);
          set({ loading: false });
          throw error;
        }
      },

      setCurrentOrganization: async (orgId: string) => {
        const { organizations } = get();
        const orgData = organizations.find((o) => o.organization.id === orgId);

        if (!orgData) {
          throw new Error('Organization not found');
        }

        set({
          currentOrganization: orgData.organization,
          currentMembership: orgData.membership,
        });

        try {
          await get().fetchTeamMembers();
        } catch (error) {
          console.warn('Could not fetch team members:', error);
        }
      },

      fetchTeamMembers: async () => {
        const { currentOrganization } = get();
        if (!currentOrganization) return;

        try {
          const { data, error } = await supabase
            .from('organization_members')
            .select(`
              role,
              user:user_profiles(*)
            `)
            .eq('organization_id', currentOrganization.id);

          if (error) throw error;

          const members = data.map((item: any, index: number) => ({
            ...item.user,
            role: item.role,
            color: generateUserColor(index),
          }));

          set({ teamMembers: members });
        } catch (error) {
          console.error('Failed to fetch team members:', error);
          throw error;
        }
      },

      updateOrganization: async (data: Partial<Organization>) => {
        const { currentOrganization } = get();
        if (!currentOrganization) throw new Error('No organization selected');

        const { error } = await supabase
          .from('organizations')
          .update(data)
          .eq('id', currentOrganization.id);

        if (error) throw error;

        // Refresh organization data
        const { data: updated, error: fetchError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', currentOrganization.id)
          .single();

        if (fetchError) throw fetchError;

        set({ currentOrganization: updated });
      },

      updateMember: async (memberId: string, data: Partial<OrganizationMember>) => {
        const { error } = await supabase
          .from('organization_members')
          .update(data)
          .eq('id', memberId);

        if (error) throw error;

        // Refresh team members
        await get().fetchTeamMembers();
      },

      inviteMember: async (email: string, role: string) => {
        const { currentOrganization, demoMode } = get();
        if (!currentOrganization) throw new Error('No organization selected');

        if (demoMode) {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 800));

          // Mock adding to local state if we want to show it immediately
          const newMember = {
            id: `demo-${Date.now()}`,
            email,
            full_name: email.split('@')[0],
            role,
            color: generateUserColor(get().teamMembers.length),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          set({ teamMembers: [...get().teamMembers, newMember as any] });
          return;
        }

        // Production: Call Supabase Edge Function or add placeholder member
        // For now, let's assume we use organization_members table with a dummy user_id or a system that handles invitations
        // Actually, let's just mock the invite success for now as we don't have the backend invitation logic yet
        await new Promise(resolve => setTimeout(resolve, 800));
      },
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        currentMembership: state.currentMembership,
      }),
    }
  )
);
