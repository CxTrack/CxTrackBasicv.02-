import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { smsService, SMSSettings } from '@/services/sms.service';
import { emailService, EmailSettings, EmailProvider } from '@/services/email.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function SharingSettings() {
  const { currentOrganization } = useOrganizationStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [smsSettings, setSmsSettings] = useState<SMSSettings | null>(null);
  const [smsFormData, setSmsFormData] = useState({
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [emailProvider, setEmailProvider] = useState<EmailProvider>('sendgrid');

  useEffect(() => {
    if (currentOrganization) {
      loadSettings();
    }
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const [sms, email] = await Promise.all([
        smsService.getSMSSettings(currentOrganization.id),
        emailService.getEmailSettings(currentOrganization.id),
      ]);

      if (sms) {
        setSmsSettings(sms);
        setSmsFormData({
          twilio_account_sid: sms.twilio_account_sid || '',
          twilio_auth_token: sms.twilio_auth_token || '',
          twilio_phone_number: sms.twilio_phone_number || '',
        });
      }

      if (email) {
        setEmailSettings(email);
        if (email.provider) {
          setEmailProvider(email.provider);
        }
      }
    } catch (error) {
      console.error('Error loading sharing settings:', error);
      toast.error('Failed to load sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSMSSettings = async () => {
    if (!currentOrganization) return;

    try {
      setSaving(true);
      await smsService.saveSMSSettings(currentOrganization.id, smsFormData);
      toast.success('SMS settings saved successfully');
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving SMS settings:', error);
      toast.error(error.message || 'Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMSConnection = async () => {
    if (!currentOrganization) return;

    try {
      const result = await smsService.testConnection(currentOrganization.id);
      if (result.success) {
        toast.success('SMS configuration is valid');
      } else {
        toast.error(result.error || 'SMS configuration test failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to test SMS connection');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Email Configuration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure email service for sending quotes and invoices
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Email Configuration Coming Soon
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Email provider configuration will be available in a future update. You can set up your preferred email service provider then.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 opacity-50 pointer-events-none">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Provider
              </label>
              <select
                value={emailProvider}
                onChange={(e) => setEmailProvider(e.target.value as EmailProvider)}
                disabled
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="sendgrid">SendGrid</option>
                <option value="resend">Resend</option>
                <option value="aws-ses">AWS SES</option>
                <option value="mailgun">Mailgun</option>
                <option value="smtp">Custom SMTP</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Sender Email"
                type="email"
                placeholder="no-reply@company.com"
                disabled
              />
              <Input
                label="Sender Name"
                type="text"
                placeholder="Company Name"
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                SMS Configuration (Twilio)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set up Twilio for sending SMS notifications
              </p>
            </div>
            {smsSettings?.is_configured && (
              <div className="ml-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <Check className="w-3 h-3 mr-1" />
                  Configured
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Twilio Account Required
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You'll need a Twilio account to send SMS. Get your credentials from{' '}
                  <a
                    href="https://console.twilio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Twilio Console
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Account SID"
              type="text"
              value={smsFormData.twilio_account_sid}
              onChange={(e) => setSmsFormData({ ...smsFormData, twilio_account_sid: e.target.value })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />

            <Input
              label="Auth Token"
              type="password"
              value={smsFormData.twilio_auth_token}
              onChange={(e) => setSmsFormData({ ...smsFormData, twilio_auth_token: e.target.value })}
              placeholder="••••••••••••••••••••••••••••••••"
            />

            <Input
              label="Sender Phone Number"
              type="tel"
              value={smsFormData.twilio_phone_number}
              onChange={(e) => setSmsFormData({ ...smsFormData, twilio_phone_number: e.target.value })}
              placeholder="+1 555 123 4567"
              helpText="Include country code (e.g., +1 for US/Canada)"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleSaveSMSSettings}
                disabled={saving || !smsFormData.twilio_account_sid || !smsFormData.twilio_auth_token || !smsFormData.twilio_phone_number}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save SMS Settings'
                )}
              </Button>

              {smsSettings?.is_configured && (
                <Button variant="outline" onClick={handleTestSMSConnection}>
                  Test Connection
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
