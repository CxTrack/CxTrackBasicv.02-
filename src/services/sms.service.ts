import { supabase } from '../lib/supabase';
import { twilioService } from './twilio.service';

export interface SMSSettings {
  id: string;
  organization_id: string;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  is_configured: boolean;
  created_at: string;
  updated_at: string;
}

export interface SMSLog {
  id: string;
  organization_id: string;
  document_type: 'quote' | 'invoice';
  document_id: string;
  recipient_phone: string;
  message_body: string;
  message_sid: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
}

function validatePhoneNumber(phone: string): { valid: boolean; formatted: string; error?: string } {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length < 10) {
    return { valid: false, formatted: phone, error: 'Phone number must be at least 10 digits' };
  }

  if (cleaned.length === 10) {
    return { valid: true, formatted: `+1${cleaned}` };
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return { valid: true, formatted: `+${cleaned}` };
  }

  if (cleaned.startsWith('+')) {
    return { valid: true, formatted: phone };
  }

  return { valid: true, formatted: `+${cleaned}` };
}

export const smsService = {
  async getSMSSettings(organizationId: string): Promise<SMSSettings | null> {
    const { data, error } = await supabase
      .from('sms_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async saveSMSSettings(
    organizationId: string,
    settings: {
      twilio_account_sid: string;
      twilio_auth_token: string;
      twilio_phone_number: string;
    }
  ): Promise<SMSSettings> {
    const existing = await this.getSMSSettings(organizationId);

    const settingsData = {
      organization_id: organizationId,
      twilio_account_sid: settings.twilio_account_sid,
      twilio_auth_token: settings.twilio_auth_token,
      twilio_phone_number: settings.twilio_phone_number,
      is_configured: !!(
        settings.twilio_account_sid &&
        settings.twilio_auth_token &&
        settings.twilio_phone_number
      ),
    };

    if (existing) {
      const { data, error } = await supabase
        .from('sms_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('sms_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async testConnection(organizationId: string): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getSMSSettings(organizationId);

    if (!settings || !settings.is_configured) {
      return { success: false, error: 'SMS settings not configured' };
    }

    return { success: true };
  },

  validatePhoneNumber,

  async sendQuoteSMS(
    organizationId: string,
    quoteId: string,
    quoteNumber: string,
    recipientPhone: string,
    shareLink: string,
    companyName: string
  ): Promise<{ success: boolean; error?: string; messageSid?: string }> {
    const settings = await this.getSMSSettings(organizationId);

    if (!settings || !settings.is_configured) {
      return { success: false, error: 'SMS service not configured. Please add your Twilio credentials in Settings.' };
    }

    const phoneValidation = validatePhoneNumber(recipientPhone);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }

    const message = `You have a new quote ${quoteNumber} from ${companyName}. View it here: ${shareLink}`;

    try {
      // Use Twilio service to actually send the SMS
      const result = await twilioService.sendSMS(
        organizationId,
        phoneValidation.formatted,
        message,
        {
          documentType: 'quote',
          documentId: quoteId,
        }
      );

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async sendInvoiceSMS(
    organizationId: string,
    invoiceId: string,
    invoiceNumber: string,
    recipientPhone: string,
    shareLink: string,
    companyName: string
  ): Promise<{ success: boolean; error?: string; messageSid?: string }> {
    const settings = await this.getSMSSettings(organizationId);

    if (!settings || !settings.is_configured) {
      return { success: false, error: 'SMS service not configured. Please add your Twilio credentials in Settings.' };
    }

    const phoneValidation = validatePhoneNumber(recipientPhone);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }

    const message = `You have a new invoice ${invoiceNumber} from ${companyName}. View it here: ${shareLink}`;

    try {
      // Use Twilio service to actually send the SMS
      const result = await twilioService.sendSMS(
        organizationId,
        phoneValidation.formatted,
        message,
        {
          documentType: 'invoice',
          documentId: invoiceId,
        }
      );

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getSMSLog(organizationId: string): Promise<SMSLog[]> {
    const { data, error } = await supabase
      .from('sms_log')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  },

  formatMessagePreview(
    documentType: 'quote' | 'invoice',
    documentNumber: string,
    shareLink: string,
    companyName: string
  ): { message: string; charCount: number } {
    const message = `You have a new ${documentType} ${documentNumber} from ${companyName}. View it here: ${shareLink}`;
    return {
      message,
      charCount: message.length,
    };
  },
};
