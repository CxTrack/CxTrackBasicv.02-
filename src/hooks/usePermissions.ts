import { useOrganizationStore } from '../stores/organizationStore';
import { useAuthStore } from '../stores/authStore';

export const usePermissions = () => {
  const { currentMembership } = useOrganizationStore();
  const { user } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    if (!currentMembership) return false;

    // Owners and admins have all permissions
    if (['owner', 'admin'].includes(currentMembership.role)) {
      return true;
    }

    // Check specific permissions in membership.permissions
    return currentMembership.permissions?.[permission] === true;
  };

  const canViewTeamCalendars = (): boolean => {
    if (!currentMembership) return false;
    return (
      ['owner', 'admin', 'manager'].includes(currentMembership.role) ||
      currentMembership.can_view_team_calendars === true
    );
  };

  const canViewUserCalendar = (userId: string): boolean => {
    if (!currentMembership) return false;

    // Can always view own calendar
    if (userId === user?.id) return true;

    // Check if user delegated access
    const delegation = currentMembership.calendar_delegation || [];
    return delegation.includes(userId);
  };

  const canEditUserCalendar = (userId: string): boolean => {
    if (!currentMembership) return false;

    // Can edit own calendar
    if (userId === user?.id) return true;

    // Only managers/admins can edit others' calendars
    return ['owner', 'admin', 'manager'].includes(currentMembership.role);
  };

  return {
    hasPermission,
    canViewTeamCalendars,
    canViewUserCalendar,
    canEditUserCalendar,
    role: currentMembership?.role,
  };
};
