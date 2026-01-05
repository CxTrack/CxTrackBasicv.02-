import { useState, useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore, Theme } from '@/stores/themeStore';
import { settingsService, BusinessSettings as BusinessSettingsType, DocumentTemplate } from '@/services/settings.service';
import { supabase } from '@/lib/supabase';
import { Building2, FileText, CreditCard, Calendar as CalendarIcon, Share2, Check, Loader2, Upload, Save, Palette, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Card } from '@/components/theme/ThemeComponents';
import CalendarSettings from './CalendarSettings';
import SharingSettings from './SharingSettings';
import toast from 'react-hot-toast';

export default function Settings() {
  const { currentOrganization, fetchUserOrganizations } = useOrganizationStore();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'business' | 'templates' | 'payment' | 'calendar' | 'sharing'>('appearance');
  const [settings, setSettings] = useState<BusinessSettingsType | null>(null);
  const [quoteTemplates, setQuoteTemplates] = useState<DocumentTemplate[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<DocumentTemplate[]>([]);
  const [devOrgId, setDevOrgId] = useState<string | null>(null);
  const [devOrgName, setDevOrgName] = useState<string>('');

  useEffect(() => {
    const initSettings = async () => {
      if (currentOrganization) {
        loadSettings();
      } else {
        // In dev mode, load the first available organization
        try {
          setLoading(true);
          const { data: orgs, error } = await supabase
            .from('organizations')
            .select('*')
            .limit(1);

          if (error) {
            console.error('Error loading organization:', error);
            toast.error('Failed to load organization');
            setLoading(false);
            return;
          }

          if (!orgs || orgs.length === 0) {
            console.error('No organizations found');
            toast.error('No organization configured. Please contact support.');
            setLoading(false);
            return;
          }

          // Manually set the current organization for dev mode
          const org = orgs[0];
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

          // Load templates for dev org
          const [quoteTemps, invoiceTemps] = await Promise.all([
            settingsService.getTemplates(org.id, 'quote'),
            settingsService.getTemplates(org.id, 'invoice'),
          ]);

          if (quoteTemps.length === 0 && invoiceTemps.length === 0) {
            await settingsService.initializeDefaultTemplates(org.id);
            const [newQuoteTemps, newInvoiceTemps] = await Promise.all([
              settingsService.getTemplates(org.id, 'quote'),
              settingsService.getTemplates(org.id, 'invoice'),
            ]);
            setQuoteTemplates(newQuoteTemps);
            setInvoiceTemplates(newInvoiceTemps);
          } else {
            setQuoteTemplates(quoteTemps);
            setInvoiceTemplates(invoiceTemps);
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

      const { data: beforeUpdate, error: beforeError } = await supabase
        .from('organizations')
        .select('business_city, business_state')
        .eq('id', orgId)
        .single();
      console.log('DB BEFORE update:', beforeUpdate);

      await settingsService.updateBusinessSettings(orgId, settings);
      console.log('Update call completed');

      const { data: afterUpdate, error: afterError } = await supabase
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

          <div className="flex gap-4 mt-6 flex-wrap">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'appearance'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'business'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Business Info
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'payment'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Settings
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('sharing')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'sharing'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Sharing
            </button>
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
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${
                        isSelected
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
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${
                      settings.default_quote_template_id === template.id
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
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${
                      settings.default_invoice_template_id === template.id
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

        {activeTab === 'calendar' && (
          <div className="max-w-4xl">
            <CalendarSettings />
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className="max-w-4xl">
            <SharingSettings />
          </div>
        )}
      </div>
    </div>
  );
}
