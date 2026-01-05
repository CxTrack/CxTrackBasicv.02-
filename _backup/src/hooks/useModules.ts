import { useOrganizationStore } from '../stores/organizationStore';
import { AVAILABLE_MODULES } from '../config/modules.config';
import { usePermissions } from './usePermissions';
import type { Module } from '../types/app.types';

export const useModules = () => {
  const { currentOrganization } = useOrganizationStore();
  const { hasPermission } = usePermissions();

  const isModuleEnabled = (moduleId: string): boolean => {
    if (!currentOrganization) return false;
    const enabledModules = currentOrganization.enabled_modules || [];
    return enabledModules.includes(moduleId);
  };

  const canAccessModule = (moduleId: string): boolean => {
    const module = AVAILABLE_MODULES[moduleId];
    if (!module) return false;

    // Check if module is enabled
    if (!isModuleEnabled(moduleId)) return false;

    // Check dependencies
    if (module.dependencies) {
      const allDepsEnabled = module.dependencies.every(isModuleEnabled);
      if (!allDepsEnabled) return false;
    }

    // Check permissions
    if (module.requiredPermissions.length > 0) {
      return module.requiredPermissions.some(hasPermission);
    }

    return true;
  };

  const getEnabledModules = (): Module[] => {
    return Object.values(AVAILABLE_MODULES).filter((module) => canAccessModule(module.id));
  };

  const getModulesByCategory = (category: Module['category']): Module[] => {
    return getEnabledModules().filter((module) => module.category === category);
  };

  return {
    isModuleEnabled,
    canAccessModule,
    getEnabledModules,
    getModulesByCategory,
  };
};
