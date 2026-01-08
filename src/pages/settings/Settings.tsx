import { useState, useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore, Theme } from '@/stores/themeStore';
import { settingsService, BusinessSettings as BusinessSettingsType, DocumentTemplate } from '@/services/settings.service';
import { supabase } from '@/lib/supabase';
import { Building2, FileText, CreditCard, Calendar as CalendarIcon, Share2, Check, Loader2, Upload, Save, Palette, Sun, Moon, Plus, Edit, Trash2, Eye, Download, Zap, Users, UserPlus, TrendingUp, CheckCircle, Link, Copy, Code, Key, Info, MoreVertical, Smartphone, Package, DollarSign, Phone, CheckSquare, LayoutGrid, HelpCircle, Mic, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Card } from '@/components/theme/ThemeComponents';
import CalendarSettings from './CalendarSettings';
import { InviteMemberModal } from '@/components/settings/InviteMemberModal';

import { usePreferencesStore } from '@/stores/preferencesStore';
import ProfileTab from '@/components/settings/ProfileTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import SecurityTab from '@/components/settings/SecurityTab';
import HelpCenterTab from '@/components/settings/HelpCenterTab';
import VoiceAgentSetup from './VoiceAgentSetup';
import toast from 'react-hot-toast';

export default function Settings() {
  const { currentOrganization, teamMembers, updateMember, fetchUserOrganizations } = useOrganizationStore();
  const { theme, setTheme } = useThemeStore();
  const { preferences, saveMobileNavItems } = usePreferencesStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'mobile' | 'business' | 'billing' | 'templates' | 'payment' | 'twilio' | 'calendar' | 'sharing' | 'notifications' | 'security' | 'help' | 'voiceagent'>('profile');
  const [settings, setSettings] = useState<BusinessSettingsType | null>(null);
  const [quoteTemplates, setQuoteTemplates] = useState<DocumentTemplate[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<DocumentTemplate[]>([]);
  const [devOrgId, setDevOrgId] = useState<string | null>(null);
  const [devOrgName, setDevOrgName] = useState<string>('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateMember(memberId, { role: newRole as any });
      toast.success('Member role updated');
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const updateSharingSettings = async (key: string, value: boolean) => {
    if (!currentOrganization) return;

    // Use metadata to store sharing toggles
    const currentSharing = currentOrganization.metadata?.sharing || {};
    const newMetadata = {
      ...currentOrganization.metadata,
      sharing: {
        ...currentSharing,
        [key]: value
      }
    };

    try {
      await useOrganizationStore.getState().updateOrganization({ metadata: newMetadata });
      toast.success('Sharing setting updated');
    } catch (error) {
      console.error('Failed to update sharing setting:', error);
      toast.error('Failed to update sharing setting');
    }
  };

  const isModuleShared = (key: string) => {
    return currentOrganization?.metadata?.sharing?.[key] ?? true;
  };

  useEffect(() => {
    const initSettings = async () => {
      if (currentOrganization) {
        loadSettings();
      } else {
        // In dev mode or fallback, try to load from localStorage first
        try {
          setLoading(true);
          let org: any = null;

          // 1. Try localStorage
          const storedOrg = localStorage.getItem('cxtrack_organization');
          if (storedOrg) {
            try {
              org = JSON.parse(storedOrg);
            } catch (e) {
              console.warn('Failed to parse stored organization', e);
            }
          }

          // 2. If no local, try Supabase
          if (!org) {
            const { data: orgs, error } = await supabase
              .from('organizations')
              .select('*')
              .limit(1);

            if (!error && orgs && orgs.length > 0) {
              org = orgs[0];
            }
          }

          // 3. If still no org, create default demo org
          if (!org) {
            org = {
              id: 'demo-org-001',
              name: 'CxTrack Demo',
              slug: 'cxtrack-demo',
              created_at: new Date().toISOString(),
              business_email: 'demo@cxtrack.com',
              business_country: 'United States',
              primary_color: '#6366f1',
              quote_prefix: 'QT',
              invoice_prefix: 'INV',
              default_payment_terms: 'Net 30'
            };
            localStorage.setItem('cxtrack_organization', JSON.stringify(org));
          }

          // Apply organization to local state
          setDevOrgId(org.id);
          setDevOrgName(org.name);
          setSettings({
            business_email: org.business_email,
            business_phone: org.business_phone,
            business_address: org.business_address,
            business_city: org.business_city,
            business_state: org.business_state,
            business_postal_code: org.business_postal_code,
            business_country: org.business_country,
            business_website: org.business_website,
            logo_url: org.logo_url,
            primary_color: org.primary_color,
            quote_prefix: org.quote_prefix,
            invoice_prefix: org.invoice_prefix,
            default_payment_terms: org.default_payment_terms,
            stripe_publishable_key: org.stripe_publishable_key,
            stripe_secret_key: org.stripe_secret_key,
            default_quote_template_id: org.default_quote_template_id,
            default_invoice_template_id: org.default_invoice_template_id,
          });

          // Load templates for dev org (with error handling)
          try {
            const [quoteTemps, invoiceTemps] = await Promise.all([
              settingsService.getTemplates(org.id, 'quote').catch(() => []),
              settingsService.getTemplates(org.id, 'invoice').catch(() => []),
            ]);

            setQuoteTemplates(quoteTemps);
            setInvoiceTemplates(invoiceTemps);
          } catch (e) {
            console.warn('Failed to load templates', e);
          }

          setLoading(false);
        } catch (error) {
          console.error('Failed to load organization:', error);
          toast.error('Failed to load settings');
          setLoading(false);
        }
      }
    };
    initSettings();
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const [settingsData, quoteTemps, invoiceTemps] = await Promise.all([
        settingsService.getBusinessSettings(currentOrganization.id),
        settingsService.getTemplates(currentOrganization.id, 'quote'),
        settingsService.getTemplates(currentOrganization.id, 'invoice'),
      ]);

      if (settingsData) {
        setSettings(settingsData);
      }

      if (quoteTemps.length === 0 && invoiceTemps.length === 0) {
        await settingsService.initializeDefaultTemplates(currentOrganization.id);
        const [newQuoteTemps, newInvoiceTemps] = await Promise.all([
          settingsService.getTemplates(currentOrganization.id, 'quote'),
          settingsService.getTemplates(currentOrganization.id, 'invoice'),
        ]);
        setQuoteTemplates(newQuoteTemps);
        setInvoiceTemplates(newInvoiceTemps);
      } else {
        setQuoteTemplates(quoteTemps);
        setInvoiceTemplates(invoiceTemps);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const orgId = currentOrganization?.id || devOrgId;
    if (!orgId || !settings) return;

    try {
      setSaving(true);
      console.log('=== SAVE DEBUG ===');
      console.log('Settings object:', settings);
      console.log('City:', settings.business_city);
      console.log('State:', settings.business_state);
      console.log('Calling updateBusinessSettings with orgId:', orgId);

      await settingsService.updateBusinessSettings(orgId, settings);
      console.log('Update call completed');

      const { data: afterUpdate } = await supabase
        .from('organizations')
        .select('business_city, business_state')
        .eq('id', orgId)
        .single();
      console.log('DB AFTER update:', afterUpdate);

      localStorage.removeItem('organization-storage');
      await fetchUserOrganizations();

      setSaved(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTemplate = async (templateId: string, type: 'quote' | 'invoice') => {
    const orgId = currentOrganization?.id || devOrgId;
    if (!orgId) return;

    try {
      const fieldName = type === 'quote' ? 'default_quote_template_id' : 'default_invoice_template_id';
      await settingsService.updateBusinessSettings(orgId, {
        [fieldName]: templateId,
      });

      setSettings(prev => prev ? { ...prev, [fieldName]: templateId } : null);
      toast.success(`Default ${type} template updated`);
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    }
  };

  const getTemplateThumbnail = (name: string) => {
    const templates: Record<string, JSX.Element> = {
      'Professional Green': (
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-emerald-600 dark:bg-emerald-500 w-1/3 rounded"></div>
            <div className="h-2 bg-emerald-400 dark:bg-emerald-600 w-1/2 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-full rounded"></div>
            <div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-3/4 rounded"></div>
            <div className="h-2 bg-emerald-300 dark:bg-emerald-700 w-5/6 rounded"></div>
          </div>
        </div>
      ),
      'Minimal White': (
        <div className="w-full h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-gray-800 dark:bg-gray-300 w-1/3 rounded"></div>
            <div className="h-2 bg-gray-400 dark:bg-gray-500 w-1/2 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-200 dark:bg-gray-600 w-full rounded"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 w-3/4 rounded"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 w-5/6 rounded"></div>
          </div>
        </div>
      ),
      'Classic Professional': (
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-blue-700 dark:bg-blue-500 w-1/3 rounded"></div>
            <div className="h-2 bg-blue-500 dark:bg-blue-600 w-1/2 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-blue-300 dark:bg-blue-700 w-full rounded"></div>
            <div className="h-2 bg-blue-300 dark:bg-blue-700 w-3/4 rounded"></div>
            <div className="h-2 bg-blue-300 dark:bg-blue-700 w-5/6 rounded"></div>
          </div>
        </div>
      ),
      'Modern Blue': (
        <div className="w-full h-full bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border-2 border-sky-200 dark:border-sky-700 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-sky-600 dark:bg-sky-500 w-1/3 rounded"></div>
            <div className="h-2 bg-sky-400 dark:bg-sky-600 w-1/2 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-sky-300 dark:bg-sky-700 w-full rounded"></div>
            <div className="h-2 bg-sky-300 dark:bg-sky-700 w-3/4 rounded"></div>
            <div className="h-2 bg-sky-300 dark:bg-sky-700 w-5/6 rounded"></div>
          </div>
        </div>
      ),
    };
    return templates[name] || templates['Modern Blue'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure your business information and preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving || saved}>
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Saved
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { id: 'profile', label: 'Profile', icon: Building2 },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'mobile', label: 'Mobile Nav', icon: Smartphone, mobileOnly: true },
              { id: 'business', label: 'Business Info', icon: Building2 },
              { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'payment', label: 'Payment', icon: Zap },
              { id: 'twilio', label: 'Communications', icon: MessageSquare },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'sharing', label: 'Sharing', icon: Share2 },
              { id: 'voiceagent', label: 'Voice Agent', icon: Mic },
              { id: 'notifications', label: 'Notifications', icon: Users },
              { id: 'security', label: 'Security', icon: Key },
              { id: 'help', label: 'Help', icon: HelpCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 border border-transparent'
                  }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'appearance' && (
          <div className="max-w-4xl space-y-6">
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appearance</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose the theme that fits your style
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    value: 'light',
                    label: 'Light',
                    description: 'Clean and bright',
                    icon: Sun,
                    previewBg: 'bg-white',
                    previewBorder: 'border-gray-200',
                  },
                  {
                    value: 'dark',
                    label: 'Dark',
                    description: 'Easy on the eyes',
                    icon: Moon,
                    previewBg: 'bg-gray-900',
                    previewBorder: 'border-gray-700',
                  },
                  {
                    value: 'soft-modern',
                    label: 'Soft Modern',
                    description: 'Warm and tactile',
                    icon: Palette,
                    previewBg: 'bg-soft-cream',
                    previewBorder: 'border-soft-cream-dark',
                  },
                ].map((themeOption) => {
                  const IconComponent = themeOption.icon;
                  const isSelected = theme === themeOption.value;

                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value as Theme)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${isSelected
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                        }`}
                    >
                      <div className={`w-full h-32 rounded-xl mb-4 ${themeOption.previewBg} flex items-center justify-center border-2 ${themeOption.previewBorder}`}>
                        <IconComponent size={40} className={
                          isSelected ? 'text-primary-600' : 'text-gray-400'
                        } />
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">
                            {themeOption.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {themeOption.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
        {activeTab === 'mobile' && (
          <div className="max-w-4xl space-y-6">
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mobile Quick Access</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
                Customize your mobile bottom navigation. Select your top 3 most used features for quick access. (Home and More are always included).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { path: '/customers', label: 'Customers', icon: Users },
                  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
                  { path: '/products', label: 'Products', icon: Package },
                  { path: '/quotes', label: 'Quotes', icon: FileText },
                  { path: '/invoices', label: 'Invoices', icon: DollarSign },
                  { path: '/calls', label: 'Calls', icon: Phone },
                  { path: '/pipeline', label: 'Pipeline', icon: TrendingUp },
                  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
                ].map((option) => {
                  const selectedItems = preferences.mobileNavItems || [];
                  const isSelected = selectedItems.includes(option.path);
                  const isMaxReached = selectedItems.length >= 3 && !isSelected;

                  return (
                    <button
                      key={option.path}
                      disabled={isMaxReached}
                      onClick={() => {
                        if (isSelected) {
                          saveMobileNavItems(selectedItems.filter(p => p !== option.path));
                        } else if (selectedItems.length < 3) {
                          saveMobileNavItems([...selectedItems, option.path]);
                        }
                      }}
                      className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left group ${isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : isMaxReached
                          ? 'opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 active:scale-95'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-gray-600'
                        }`}>
                        <option.icon size={22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{option.label}</p>
                        {isSelected ? (
                          <div className="flex items-center text-[10px] text-blue-600 mt-0.5 font-bold uppercase tracking-wider">
                            <Check size={10} className="mr-1" />
                            Selected
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Available</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                  <Smartphone size={16} className="mr-2 text-blue-600" />
                  Bottom Bar Preview
                </p>
                <div className="flex justify-around items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-inner border border-slate-200 dark:border-gray-700 max-w-sm mx-auto">
                  <div className="flex flex-col items-center opacity-40"><LayoutGrid size={18} /><span className="text-[8px] mt-1 font-bold">Home</span></div>
                  {(preferences.mobileNavItems || []).map(path => {
                    const item = [
                      { path: '/customers', label: 'Customers', icon: Users },
                      { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
                      { path: '/products', label: 'Products', icon: Package },
                      { path: '/quotes', label: 'Quotes', icon: FileText },
                      { path: '/invoices', label: 'Invoices', icon: DollarSign },
                      { path: '/calls', label: 'Calls', icon: Phone },
                      { path: '/pipeline', label: 'Pipeline', icon: TrendingUp },
                      { path: '/tasks', label: 'Tasks', icon: CheckSquare },
                    ].find(o => o.path === path);
                    if (!item) return null;
                    return (
                      <div key={path} className="flex flex-col items-center text-blue-600">
                        <item.icon size={18} />
                        <span className="text-[8px] mt-1 font-bold">{item.label}</span>
                      </div>
                    );
                  })}
                  <div className="flex flex-col items-center opacity-40"><MoreVertical size={18} /><span className="text-[8px] mt-1 font-bold">More</span></div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Brand Identity</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo
                  </label>
                  <div className="flex items-center gap-4">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload Logo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary_color || '#6366f1'}
                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={settings.primary_color || '#6366f1'}
                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Name
                  </label>
                  <Input
                    type="text"
                    value={currentOrganization?.name || devOrgName || ''}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Email
                  </label>
                  <Input
                    type="email"
                    value={settings.business_email || ''}
                    onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Phone
                  </label>
                  <PhoneInput
                    value={settings.business_phone || ''}
                    onChange={(e) => {
                      console.log('Phone onChange fired:', e.target.value);
                      setSettings({ ...settings, business_phone: e.target.value });
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={settings.business_website || ''}
                    onChange={(e) => setSettings({ ...settings, business_website: e.target.value })}
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Business Address</h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Street Address
                  </label>
                  <Input
                    type="text"
                    value={settings.business_address || ''}
                    onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <Input
                      type="text"
                      value={settings.business_city || ''}
                      onChange={(e) => {
                        console.log('City onChange fired:', e.target.value);
                        setSettings({ ...settings, business_city: e.target.value });
                      }}
                      placeholder="Toronto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State/Province
                    </label>
                    <Input
                      type="text"
                      value={settings.business_state || ''}
                      onChange={(e) => {
                        console.log('State onChange fired:', e.target.value);
                        setSettings({ ...settings, business_state: e.target.value });
                      }}
                      placeholder="ON"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <Input
                      type="text"
                      value={settings.business_postal_code || ''}
                      onChange={(e) => setSettings({ ...settings, business_postal_code: e.target.value })}
                      placeholder="M5H 2N2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      value={settings.business_country || 'Canada'}
                      onChange={(e) => setSettings({ ...settings, business_country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Canada">Canada</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="New Zealand">New Zealand</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Spain">Spain</option>
                      <option value="Italy">Italy</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Japan">Japan</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Singapore">Singapore</option>
                      <option value="India">India</option>
                      <option value="Ireland">Ireland</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="max-w-4xl space-y-6">

            {/* Current Plan */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Professional Plan
                    </h3>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Unlimited users • Advanced features • Priority support
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      $49
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      / month
                    </span>
                  </div>
                </div>
                <button className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                  Change Plan
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Next billing date: January 15, 2026
                  </span>
                  <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Cancel subscription
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Methods
                </h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Card
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Card 1 - Default */}
                <div className="flex items-center justify-between p-4 border-2 border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          •••• •••• •••• 4242
                        </p>
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                          Default
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Visa • Expires 12/2027
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        •••• •••• •••• 5555
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Mastercard • Expires 03/2026
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors">
                      Set as Default
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Billing History
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View and download your invoices
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Invoice
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Invoice Row 1 */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              INV-2025-001
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Professional Plan
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        Dec 15, 2025
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          $49.00
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
                          Paid
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="View Invoice">
                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Download PDF">
                            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Invoice Row 2 */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              INV-2024-012
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Professional Plan
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        Nov 15, 2025
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          $49.00
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
                          Paid
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Invoice Row 3 - Failed */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              INV-2024-011
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Professional Plan
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        Oct 15, 2025
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          $49.00
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-full border border-rose-200 dark:border-rose-800">
                          Failed
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-colors">
                            Retry Payment
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  View all invoices →
                </button>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Usage This Month
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    12 <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/ Unlimited</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    API Calls
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    8,342 <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/ 10,000</span>
                  </p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '83%' }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Storage
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    2.4 GB <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/ 10 GB</span>
                  </p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-6xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Document Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quote Prefix
                  </label>
                  <Input
                    type="text"
                    value={settings.quote_prefix}
                    onChange={(e) => setSettings({ ...settings, quote_prefix: e.target.value })}
                    placeholder="QT"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Example: QT-0001</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice Prefix
                  </label>
                  <Input
                    type="text"
                    value={settings.invoice_prefix}
                    onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                    placeholder="INV"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Example: INV-0001</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Payment Terms
                  </label>
                  <Input
                    type="text"
                    value={settings.default_payment_terms}
                    onChange={(e) => setSettings({ ...settings, default_payment_terms: e.target.value })}
                    placeholder="Net 30"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., Net 30, Due on Receipt</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quote Templates</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Select a default template for your quotes
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quoteTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${settings.default_quote_template_id === template.id
                      ? 'ring-2 ring-blue-600 shadow-lg'
                      : 'hover:shadow-lg hover:scale-105'
                      }`}
                    onClick={() => handleSelectTemplate(template.id, 'quote')}
                  >
                    <div className="h-48">
                      {getTemplateThumbnail(template.name)}
                    </div>
                    {settings.default_quote_template_id === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{template.layout_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Templates</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Select a default template for your invoices
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {invoiceTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${settings.default_invoice_template_id === template.id
                      ? 'ring-2 ring-blue-600 shadow-lg'
                      : 'hover:shadow-lg hover:scale-105'
                      }`}
                    onClick={() => handleSelectTemplate(template.id, 'invoice')}
                  >
                    <div className="h-48">
                      {getTemplateThumbnail(template.name)}
                    </div>
                    {settings.default_invoice_template_id === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{template.layout_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stripe Integration</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Connect your Stripe account to accept online payments
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {settings.stripe_secret_key ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Not Connected</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stripe Publishable Key
                  </label>
                  <Input
                    type="text"
                    value={settings.stripe_publishable_key || ''}
                    onChange={(e) => setSettings({ ...settings, stripe_publishable_key: e.target.value })}
                    placeholder="pk_test_..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your public Stripe API key (starts with pk_)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stripe Secret Key
                  </label>
                  <Input
                    type="password"
                    value={settings.stripe_secret_key || ''}
                    onChange={(e) => setSettings({ ...settings, stripe_secret_key: e.target.value })}
                    placeholder="sk_test_..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your secret Stripe API key (starts with sk_)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Payment Methods</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select which payment methods you accept
              </p>

              <div className="space-y-3">
                {['Credit Card', 'Debit Card', 'Bank Transfer', 'Check', 'Cash', 'PayPal'].map((method) => (
                  <label key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-900 dark:text-white">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'twilio' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Twilio Integration</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Connect your Twilio account to send SMS messages and make calls
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Not Connected</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Twilio Account SID
                  </label>
                  <Input
                    type="text"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Find this in your Twilio Console Dashboard
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auth Token
                  </label>
                  <Input
                    type="password"
                    placeholder="Your Twilio auth token"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Keep this secret - never share it publicly
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Twilio Phone Number
                  </label>
                  <PhoneInput
                    value=""
                    onChange={() => { }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your Twilio phone number for sending SMS and making calls
                  </p>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="mr-3">
                    Test Connection
                  </Button>
                  <Button>
                    Save Twilio Settings
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SMS Capabilities</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                With Twilio configured, you can:
              </p>

              <div className="space-y-3">
                {[
                  { label: 'Send quotes via SMS', description: 'Share quotes directly to customer phones' },
                  { label: 'Send invoices via SMS', description: 'Notify customers about new invoices' },
                  { label: 'Appointment reminders', description: 'Automatically remind customers of upcoming appointments' },
                  { label: 'AI Voice Agent calls', description: 'Enable outbound calls from your AI agent' },
                ].map((feature) => (
                  <div key={feature.label} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{feature.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Need a Twilio account?</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">twilio.com</a> to get your Account SID, Auth Token, and purchase a phone number.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="max-w-4xl">
            <CalendarSettings />
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className="space-y-6">

            {/* Team Members with Access */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Team Members
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage who has access to your CRM data
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </button>
              </div>

              <div className="p-6 space-y-4">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <div key={member.id} className={`flex items-center justify-between p-4 border-2 ${member.role === 'owner' ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'} rounded-xl transition-all`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden" style={{ backgroundColor: member.color || '#6366f1' }}>
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name || ''} className="w-full h-full object-cover" />
                          ) : (
                            (member.full_name || member.email).split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {member.full_name || 'Unnamed User'}
                            </p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${member.role === 'owner' ? 'bg-blue-600 text-white' :
                              member.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              }`}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      {member.role !== 'owner' ? (
                        <div className="flex items-center gap-3">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="user">User</option>
                          </select>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          Full Access
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-20" />
                    <p className="text-gray-500">No team members found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shared Resources */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Shared Resources
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Control what team members can access
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Customers Sharing */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        Customer Database
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        All team members can view and edit customer records
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isModuleShared('customers')}
                      onChange={(e) => updateSharingSettings('customers', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Calendar Sharing */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        Shared Calendar
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Team can see all appointments and meetings
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isModuleShared('calendar')}
                      onChange={(e) => updateSharingSettings('calendar', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Pipeline Sharing */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        Sales Pipeline
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Collaborative deal tracking and revenue visibility
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isModuleShared('pipeline')}
                      onChange={(e) => updateSharingSettings('pipeline', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Tasks Sharing */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        Task Management
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Assign and track tasks across the team
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isModuleShared('tasks')}
                      onChange={(e) => updateSharingSettings('tasks', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* External Sharing & Integrations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  External Sharing
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Share data with external tools and platforms
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Public Link Sharing */}
                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          Public Booking Link
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Share this link for customers to book appointments
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium transition-colors">
                      Generate Link
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      value="https://cxtrack.com/book/manik-sharma"
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("https://cxtrack.com/book/manik-sharma");
                        toast.success("Link copied to clipboard");
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Zapier Integration */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        Zapier Integration
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connect CxTrack to 5,000+ apps
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium text-sm transition-colors">
                    Connect
                  </button>
                </div>

                {/* Webhook URL */}
                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          Webhook URL
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive real-time CRM events
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                      Configure
                    </button>
                  </div>
                </div>

                {/* API Access */}
                <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50/30 dark:bg-gray-900/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                        <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          API Keys
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Generate API keys for custom integrations
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 font-medium text-sm transition-colors">
                      Manage Keys
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Permission Levels Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-3">
                    Permission Levels
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Owner:</strong> Full control including billing and team management
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Admin:</strong> Manage all CRM data and settings except billing
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Full Access:</strong> Create, edit, and delete all records
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Can Edit:</strong> View and edit existing records
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Can View:</strong> Read-only access to CRM data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'voiceagent' && <VoiceAgentSetup />}
        {activeTab === 'help' && <HelpCenterTab />}
      </div>
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
