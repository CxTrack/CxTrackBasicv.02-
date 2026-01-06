import React from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { UserRole } from '@/types/database.types';

interface PermissionGuardProps {
    children: React.ReactNode;
    requiredRole?: UserRole | UserRole[];
    fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    requiredRole,
    fallback = null
}) => {
    const { currentMembership } = useOrganizationStore();

    if (!currentMembership) return <>{fallback}</>;

    const userRole = currentMembership.role;

    // Owner always has access
    if (userRole === 'owner') return <>{children}</>;

    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        // Check if user has one of the required roles
        // Higher roles (admin) should usually include lower ones, but we'll be explicit
        const roleHierarchy: Record<UserRole, number> = {
            'owner': 4,
            'admin': 3,
            'manager': 2,
            'user': 1
        };

        const userLevel = roleHierarchy[userRole];
        const requiredLevel = Math.max(...roles.map(r => roleHierarchy[r]));

        if (userLevel >= requiredLevel) {
            return <>{children}</>;
        }
    }

    return <>{fallback}</>;
};

export const usePermission = () => {
    const { currentMembership } = useOrganizationStore();

    const hasRole = (role: UserRole | UserRole[]) => {
        if (!currentMembership) return false;
        if (currentMembership.role === 'owner') return true;

        const roles = Array.isArray(role) ? role : [role];
        const roleHierarchy: Record<UserRole, number> = {
            'owner': 4,
            'admin': 3,
            'manager': 2,
            'user': 1
        };

        const userLevel = roleHierarchy[currentMembership.role];
        const requiredLevel = Math.max(...roles.map(r => roleHierarchy[r]));

        return userLevel >= requiredLevel;
    };

    return { hasRole, role: currentMembership?.role };
};
