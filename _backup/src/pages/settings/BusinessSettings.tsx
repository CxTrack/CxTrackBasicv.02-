import { useState, useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { settingsService, BusinessSettings as BusinessSettingsType, DocumentTemplate } from '@/services/settings.service';
import { Building2, Mail, Phone, MapPin, Globe, CreditCard, FileText, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function BusinessSettings() {
  const { currentOrganization } = useOrganizationStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettingsType | null>(null);
  const [quoteTemplates, setQuoteTemplates] = useState<DocumentTemplate[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<DocumentTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'business' | 'templates' | 'payment'>('business');

  useEffect(() => {
    if (currentOrganization) {
      loadSettings();
    }
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

  const handleSaveBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization || !settings) return;

    try {
      setSaving(true);
      await settingsService.updateBusinessSettings(currentOrganization.id, settings);
      toast.success('Business information updated successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTemplate = async (templateId: string, type: 'quote' | 'invoice') => {
    if (!currentOrganization) return;

    try {
      const fieldName = type === 'quote' ? 'default_quote_template_id' : 'default_invoice_template_id';
      await settingsService.updateBusinessSettings(currentOrganization.id, {
        [fieldName]: templateId,
      });

      setSettings(prev => prev ? { ...prev, [fieldName]: templateId } : null);
      toast.success(`Default ${type} template updated`);
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    }
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure your business information and document templates
        </p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('business')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'business'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Business Info
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'payment'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Payment Settings
        </button>
      </div>

      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusinessInfo} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
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
                <Phone className="w-4 h-4 inline mr-2" />
                Business Phone
              </label>
              <Input
                type="tel"
                value={settings.business_phone || ''}
                onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Street Address
              </label>
              <Input
                type="text"
                value={settings.business_address || ''}
                onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                placeholder="123 Business Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <Input
                type="text"
                value={settings.business_city || ''}
                onChange={(e) => setSettings({ ...settings, business_city: e.target.value })}
                placeholder="San Francisco"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State/Province
              </label>
              <Input
                type="text"
                value={settings.business_state || ''}
                onChange={(e) => setSettings({ ...settings, business_state: e.target.value })}
                placeholder="CA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Postal Code
              </label>
              <Input
                type="text"
                value={settings.business_postal_code || ''}
                onChange={(e) => setSettings({ ...settings, business_postal_code: e.target.value })}
                placeholder="94102"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <Input
                type="text"
                value={settings.business_country || ''}
                onChange={(e) => setSettings({ ...settings, business_country: e.target.value })}
                placeholder="United States"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Website
              </label>
              <Input
                type="url"
                value={settings.business_website || ''}
                onChange={(e) => setSettings({ ...settings, business_website: e.target.value })}
                placeholder="https://www.company.com"
              />
            </div>

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
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Payment Terms
              </label>
              <Input
                type="text"
                value={settings.default_payment_terms}
                onChange={(e) => setSettings({ ...settings, default_payment_terms: e.target.value })}
                placeholder="Net 30"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quote Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quoteTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 cursor-pointer transition-all ${
                    settings.default_quote_template_id === template.id
                      ? 'ring-2 ring-blue-600'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectTemplate(template.id, 'quote')}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-3 flex items-center justify-center relative">
                    {settings.default_quote_template_id === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{template.layout_type} Layout</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invoice Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {invoiceTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 cursor-pointer transition-all ${
                    settings.default_invoice_template_id === template.id
                      ? 'ring-2 ring-blue-600'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectTemplate(template.id, 'invoice')}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-3 flex items-center justify-center relative">
                    {settings.default_invoice_template_id === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{template.layout_type} Layout</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Stripe Integration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Connect your Stripe account to accept online payments for invoices
            </p>
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
              <p className="text-xs text-gray-500 mt-1">Your public Stripe API key (starts with pk_)</p>
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
              <p className="text-xs text-gray-500 mt-1">Your secret Stripe API key (starts with sk_)</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveBusinessInfo} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Stripe Settings'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
