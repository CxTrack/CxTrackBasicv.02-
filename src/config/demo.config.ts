export const DEMO_MODE = true;

if (typeof window !== 'undefined') {
  localStorage.setItem('DEMO_MODE', 'true');
  console.log('💾 DEMO MODE: ENABLED - Using localStorage');
}

export const DEMO_MODE_CONFIG = {
  enabled: DEMO_MODE,
  demoOrganizationId: '00000000-0000-0000-0000-000000000000',
  demoUserId: '00000000-0000-0000-0000-000000000001',
} as const;

export const DEMO_STORAGE_KEYS = {
  customers: 'cxtrack_demo_customers',
  products: 'cxtrack_demo_products',
  quotes: 'cxtrack_demo_quotes',
  invoices: 'cxtrack_demo_invoices',
  calendar: 'cxtrack_demo_calendar',
  tasks: 'cxtrack_demo_tasks',
  calls: 'cxtrack_demo_calls',
  customer_notes: 'cxtrack_demo_customer_notes',
} as const;

export const isDemoMode = () => DEMO_MODE_CONFIG.enabled;

export const getDemoOrganizationId = () => DEMO_MODE_CONFIG.demoOrganizationId;

export const getDemoUserId = () => DEMO_MODE_CONFIG.demoUserId;

export const loadDemoData = <T = any>(key: string): T[] => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveDemoData = <T = any>(key: string, data: T[]): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Saved ${key}:`, data.length, 'items');
    return true;
  } catch (error) {
    console.error('❌ Error saving demo data:', error);
    return false;
  }
};

export const generateDemoId = (prefix: string = 'demo'): string => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
};

export const clearAllDemoData = (): void => {
  Object.values(DEMO_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('✅ All demo data cleared');
};
