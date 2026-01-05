import { supabase } from '../lib/supabase';
import { isDemoMode, getDemoOrganizationId, DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '../config/demo.config';
import { useOrganizationStore } from '../stores/organizationStore';
import { useQuoteStore } from '../stores/quoteStore';

export interface QuoteLineItem {
  id?: string;
  product_id?: string;
  product_type?: 'product' | 'service';
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_rate?: number;
  line_total: number;
  is_optional?: boolean;
  sort_order: number;
}

export interface QuoteFormData {
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: any;
  quote_date: string;
  expiry_date?: string;
  items: QuoteLineItem[];
  subtotal: number;
  discount_amount?: number;
  discount_percentage?: number;
  tax_amount: number;
  total_amount: number;
  payment_terms?: string;
  notes?: string;
  terms?: string;
  status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted';
}

export interface Quote extends QuoteFormData {
  id: string;
  organization_id: string;
  quote_number: string;
  version: number;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  converted_to_invoice_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const quoteService = {
  async generateQuoteNumber(organizationId: string, prefix: string = 'QT'): Promise<string> {
    const { data, error } = await supabase
      .from('quotes')
      .select('quote_number')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return `${prefix}-0001`;
    }

    const lastNumber = parseInt(data.quote_number.split('-')[1] || '0');
    return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`;
  },

  async createQuote(quoteData: QuoteFormData): Promise<Quote> {
    if (DEMO_MODE) {
      const quoteStore = useQuoteStore.getState();
      const quote = await quoteStore.createQuote({
        organization_id: getDemoOrganizationId(),
        quote_number: '',
        customer_id: quoteData.customer_id,
        customer_name: quoteData.customer_name,
        customer_email: quoteData.customer_email,
        customer_address: quoteData.customer_address,
        quote_date: quoteData.quote_date,
        expiry_date: quoteData.expiry_date,
        subtotal: quoteData.subtotal,
        discount_amount: quoteData.discount_amount || 0,
        discount_percentage: quoteData.discount_percentage || 0,
        tax_amount: quoteData.tax_amount,
        total_amount: quoteData.total_amount,
        payment_terms: quoteData.payment_terms,
        notes: quoteData.notes,
        terms: quoteData.terms,
        status: quoteData.status || 'draft',
        items: quoteData.items,
      } as any);

      if (!quote) {
        throw new Error('Failed to create quote');
      }

      return quote;
    }

    let organizationId: string;
    let userId: string;

    const orgStore = useOrganizationStore.getState();
    const currentOrg = orgStore.currentOrganization;

    if (!currentOrg) {
      throw new Error('No organization available');
    }

    organizationId = currentOrg.id;

    const isDemoOrg = organizationId === '00000000-0000-0000-0000-000000000000';
    if (isDemoOrg) {
      userId = '00000000-0000-0000-0000-000000000001';
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      userId = user.id;
    }

    const quoteNumber = await this.generateQuoteNumber(organizationId);

    const quoteInsertData: any = {
      organization_id: organizationId,
      quote_number: quoteNumber,
      customer_id: quoteData.customer_id,
      customer_name: quoteData.customer_name,
      customer_email: quoteData.customer_email,
      customer_address: quoteData.customer_address,
      quote_date: quoteData.quote_date,
      expiry_date: quoteData.expiry_date,
      subtotal: quoteData.subtotal,
      discount_amount: quoteData.discount_amount || 0,
      discount_percentage: quoteData.discount_percentage || 0,
      tax_amount: quoteData.tax_amount,
      total_amount: quoteData.total_amount,
      payment_terms: quoteData.payment_terms,
      notes: quoteData.notes,
      terms: quoteData.terms,
      status: quoteData.status || 'draft',
    };

    if (userId && userId !== '00000000-0000-0000-0000-000000000001') {
      quoteInsertData.created_by = userId;
    }

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert(quoteInsertData)
      .select()
      .single();

    if (quoteError) throw quoteError;

    const items = quoteData.items.map(item => ({
      quote_id: quote.id,
      product_id: item.product_id,
      product_name: item.product_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      discount_amount: item.discount_amount || 0,
      tax_rate: item.tax_rate || 0,
      line_total: item.line_total,
      is_optional: item.is_optional || false,
      sort_order: item.sort_order,
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return { ...quote, items: quoteData.items };
  },

  async getQuote(quoteId: string): Promise<Quote | null> {
    if (DEMO_MODE) {
      const quoteStore = useQuoteStore.getState();
      return quoteStore.getQuoteById(quoteId) || null;
    }

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .maybeSingle();

    if (quoteError) throw quoteError;
    if (!quote) return null;

    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('sort_order');

    if (itemsError) throw itemsError;

    return { ...quote, items: items || [] };
  },

  async getQuotes(organizationId: string): Promise<Quote[]> {
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*, quote_items(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (quotesError) throw quotesError;

    return quotes.map((quote: any) => ({
      ...quote,
      items: quote.quote_items || [],
    }));
  },

  async updateQuote(
    quoteId: string,
    updates: Partial<QuoteFormData>
  ): Promise<void> {
    if (DEMO_MODE) {
      const quoteStore = useQuoteStore.getState();
      await quoteStore.updateQuote(quoteId, updates as any);
      return;
    }

    const { error: quoteError } = await supabase
      .from('quotes')
      .update({
        customer_id: updates.customer_id,
        customer_name: updates.customer_name,
        customer_email: updates.customer_email,
        customer_address: updates.customer_address,
        quote_date: updates.quote_date,
        expiry_date: updates.expiry_date,
        subtotal: updates.subtotal,
        discount_amount: updates.discount_amount,
        discount_percentage: updates.discount_percentage,
        tax_amount: updates.tax_amount,
        total_amount: updates.total_amount,
        payment_terms: updates.payment_terms,
        notes: updates.notes,
        terms: updates.terms,
        status: updates.status,
      })
      .eq('id', quoteId);

    if (quoteError) throw quoteError;

    if (updates.items) {
      await supabase.from('quote_items').delete().eq('quote_id', quoteId);

      const items = updates.items.map(item => ({
        quote_id: quoteId,
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.tax_rate || 0,
        line_total: item.line_total,
        is_optional: item.is_optional || false,
        sort_order: item.sort_order,
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }
  },

  async deleteQuote(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    if (error) throw error;
  },

  async sendQuote(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (error) throw error;
  },

  async markAsViewed(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (error) throw error;
  },

  async acceptQuote(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (error) throw error;
  },

  async declineQuote(quoteId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: reason,
      })
      .eq('id', quoteId);

    if (error) throw error;
  },
};
