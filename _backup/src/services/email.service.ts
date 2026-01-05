import { supabase } from '../lib/supabase';

export type EmailProvider = 'sendgrid' | 'resend' | 'aws-ses' | 'mailgun' | 'smtp';

export interface EmailSettings {
  id: string;
  organization_id: string;
  provider: EmailProvider | null;
  api_key: string | null;
  sender_email: string | null;
  sender_name: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string | null;
  is_configured: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  documentType: 'quote' | 'invoice';
  documentId: string;
  documentNumber: string;
  shareLink: string;
}

export const emailService = {
  async getEmailSettings(organizationId: string): Promise<EmailSettings | null> {
    const { data, error } = await supabase
      .from('email_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async saveEmailSettings(
    organizationId: string,
    settings: {
      provider: EmailProvider;
      api_key?: string;
      sender_email?: string;
      sender_name?: string;
      smtp_host?: string;
      smtp_port?: number;
      smtp_username?: string;
      smtp_password?: string;
    }
  ): Promise<EmailSettings> {
    const existing = await this.getEmailSettings(organizationId);

    const isConfigured = settings.provider === 'smtp'
      ? !!(settings.smtp_host && settings.smtp_port && settings.smtp_username && settings.smtp_password)
      : !!(settings.api_key && settings.sender_email);

    const settingsData = {
      organization_id: organizationId,
      provider: settings.provider,
      api_key: settings.api_key || null,
      sender_email: settings.sender_email || null,
      sender_name: settings.sender_name || null,
      smtp_host: settings.smtp_host || null,
      smtp_port: settings.smtp_port || null,
      smtp_username: settings.smtp_username || null,
      smtp_password: settings.smtp_password || null,
      is_configured: isConfigured,
    };

    if (existing) {
      const { data, error } = await supabase
        .from('email_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('email_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async sendQuoteEmail(
    organizationId: string,
    emailData: EmailData
  ): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getEmailSettings(organizationId);

    if (!settings || !settings.is_configured) {
      return {
        success: false,
        error: 'Email service not configured. Please configure your email provider in Settings.',
      };
    }

    return {
      success: false,
      error: 'Email sending functionality will be implemented after provider configuration is complete.',
    };
  },

  async sendInvoiceEmail(
    organizationId: string,
    emailData: EmailData
  ): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getEmailSettings(organizationId);

    if (!settings || !settings.is_configured) {
      return {
        success: false,
        error: 'Email service not configured. Please configure your email provider in Settings.',
      };
    }

    return {
      success: false,
      error: 'Email sending functionality will be implemented after provider configuration is complete.',
    };
  },

  generateEmailSubject(documentType: 'quote' | 'invoice', documentNumber: string, companyName: string): string {
    return `New ${documentType === 'quote' ? 'Quote' : 'Invoice'} ${documentNumber} from ${companyName}`;
  },

  generateEmailBody(
    documentType: 'quote' | 'invoice',
    documentNumber: string,
    companyName: string,
    shareLink: string,
    customMessage?: string
  ): string {
    const greeting = `You have received a new ${documentType} from ${companyName}.`;
    const details = `${documentType === 'quote' ? 'Quote' : 'Invoice'} Number: ${documentNumber}`;
    const action = `View your ${documentType}: ${shareLink}`;
    const custom = customMessage ? `\n\nMessage:\n${customMessage}` : '';

    return `${greeting}\n\n${details}\n\n${action}${custom}\n\nThank you for your business!\n\n${companyName}`;
  },
};
