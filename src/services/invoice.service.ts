import { supabase } from '../lib/supabase';
import { Quote } from './quote.service';

export interface InvoiceLineItem {
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
  sort_order: number;
}

export interface InvoiceFormData {
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: any;
  quote_id?: string;
  invoice_date: string;
  due_date: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discount_amount?: number;
  tax_amount: number;
  total_amount: number;
  amount_paid?: number;
  amount_due: number;
  payment_method?: string;
  payment_terms?: string;
  notes?: string;
  terms?: string;
  status?: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';
}

export interface Invoice extends InvoiceFormData {
  id: string;
  organization_id: string;
  invoice_number: string;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  last_reminder_sent_at: string | null;
  reminder_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const invoiceService = {
  async generateInvoiceNumber(organizationId: string, prefix: string = 'INV'): Promise<string> {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return `${prefix}-0001`;
    }

    const lastNumber = parseInt(data.invoice_number.split('-')[1] || '0');
    return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`;
  },

  async createInvoice(
    organizationId: string,
    userId: string,
    invoiceData: InvoiceFormData
  ): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    const invoiceInsertData: any = {
      organization_id: organizationId,
      invoice_number: invoiceNumber,
      customer_id: invoiceData.customer_id,
      customer_name: invoiceData.customer_name,
      customer_email: invoiceData.customer_email,
      customer_address: invoiceData.customer_address,
      quote_id: invoiceData.quote_id,
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      subtotal: invoiceData.subtotal,
      discount_amount: invoiceData.discount_amount || 0,
      tax_amount: invoiceData.tax_amount,
      total_amount: invoiceData.total_amount,
      amount_paid: invoiceData.amount_paid || 0,
      amount_due: invoiceData.amount_due,
      payment_method: invoiceData.payment_method,
      payment_terms: invoiceData.payment_terms,
      notes: invoiceData.notes,
      terms: invoiceData.terms,
      status: invoiceData.status || 'draft',
    };

    if (userId && userId !== '00000000-0000-0000-0000-000000000001') {
      invoiceInsertData.created_by = userId;
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceInsertData)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const items = invoiceData.items.map(item => ({
      invoice_id: invoice.id,
      product_id: item.product_id,
      product_name: item.product_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      discount_amount: item.discount_amount || 0,
      tax_rate: item.tax_rate || 0,
      line_total: item.line_total,
      sort_order: item.sort_order,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return { ...invoice, items: invoiceData.items };
  },

  async createInvoiceFromQuote(
    organizationId: string,
    userId: string,
    quote: Quote,
    invoiceDate: string,
    dueDate: string
  ): Promise<Invoice> {
    const invoiceData: InvoiceFormData = {
      customer_id: quote.customer_id,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      customer_address: quote.customer_address,
      quote_id: quote.id,
      invoice_date: invoiceDate,
      due_date: dueDate,
      items: quote.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        discount_amount: item.discount_amount,
        tax_rate: item.tax_rate,
        line_total: item.line_total,
        sort_order: item.sort_order,
      })),
      subtotal: quote.subtotal,
      discount_amount: quote.discount_amount,
      tax_amount: quote.tax_amount,
      total_amount: quote.total_amount,
      amount_paid: 0,
      amount_due: quote.total_amount,
      payment_terms: quote.payment_terms,
      notes: quote.notes,
      terms: quote.terms,
      status: 'draft',
    };

    const invoice = await this.createInvoice(organizationId, userId, invoiceData);

    await supabase
      .from('quotes')
      .update({
        status: 'converted',
        converted_to_invoice_id: invoice.id,
        converted_at: new Date().toISOString(),
      })
      .eq('id', quote.id);

    return invoice;
  },

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    // Handle demo mode
    if (typeof window !== 'undefined' && localStorage.getItem('DEMO_MODE') === 'true') {
      const demoInvoices = JSON.parse(localStorage.getItem('cxtrack_demo_invoices') || '[]');
      const invoice = demoInvoices.find((inv: Invoice) => inv.id === invoiceId);
      return invoice || null;
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceError) throw invoiceError;
    if (!invoice) return null;

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sort_order');

    if (itemsError) throw itemsError;

    return { ...invoice, items: items || [] };
  },

  async getInvoices(organizationId: string): Promise<Invoice[]> {
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (invoicesError) throw invoicesError;

    return invoices.map((invoice: any) => ({
      ...invoice,
      items: invoice.invoice_items || [],
    }));
  },

  async updateInvoice(
    invoiceId: string,
    updates: Partial<InvoiceFormData>
  ): Promise<void> {
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        customer_id: updates.customer_id,
        customer_name: updates.customer_name,
        customer_email: updates.customer_email,
        customer_address: updates.customer_address,
        invoice_date: updates.invoice_date,
        due_date: updates.due_date,
        subtotal: updates.subtotal,
        discount_amount: updates.discount_amount,
        tax_amount: updates.tax_amount,
        total_amount: updates.total_amount,
        amount_paid: updates.amount_paid,
        amount_due: updates.amount_due,
        payment_method: updates.payment_method,
        payment_terms: updates.payment_terms,
        notes: updates.notes,
        terms: updates.terms,
        status: updates.status,
      })
      .eq('id', invoiceId);

    if (invoiceError) throw invoiceError;

    if (updates.items) {
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);

      const items = updates.items.map(item => ({
        invoice_id: invoiceId,
        product_id: item.product_id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.tax_rate || 0,
        line_total: item.line_total,
        sort_order: item.sort_order,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    // Handle demo mode
    if (typeof window !== 'undefined' && localStorage.getItem('DEMO_MODE') === 'true') {
      const demoInvoices = JSON.parse(localStorage.getItem('cxtrack_demo_invoices') || '[]');
      const filteredInvoices = demoInvoices.filter((inv: Invoice) => inv.id !== invoiceId);
      localStorage.setItem('cxtrack_demo_invoices', JSON.stringify(filteredInvoices));
      return;
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  },

  async sendInvoice(invoiceId: string): Promise<void> {
    // Handle demo mode
    if (typeof window !== 'undefined' && localStorage.getItem('DEMO_MODE') === 'true') {
      const demoInvoices = JSON.parse(localStorage.getItem('cxtrack_demo_invoices') || '[]');
      const updatedInvoices = demoInvoices.map((inv: Invoice) =>
        inv.id === invoiceId
          ? { ...inv, status: 'sent' as const, sent_at: new Date().toISOString() }
          : inv
      );
      localStorage.setItem('cxtrack_demo_invoices', JSON.stringify(updatedInvoices));
      return;
    }

    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (error) throw error;
  },

  async markAsPaid(invoiceId: string, paymentAmount: number): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount;
    const newAmountDue = invoice.total_amount - newAmountPaid;

    let status: Invoice['status'] = 'partial';
    if (newAmountDue <= 0) {
      status = 'paid';
    }

    // Handle demo mode
    if (typeof window !== 'undefined' && localStorage.getItem('DEMO_MODE') === 'true') {
      const demoInvoices = JSON.parse(localStorage.getItem('cxtrack_demo_invoices') || '[]');
      const updatedInvoices = demoInvoices.map((inv: Invoice) =>
        inv.id === invoiceId
          ? {
              ...inv,
              amount_paid: newAmountPaid,
              amount_due: newAmountDue,
              status,
              paid_at: status === 'paid' ? new Date().toISOString() : null,
            }
          : inv
      );
      localStorage.setItem('cxtrack_demo_invoices', JSON.stringify(updatedInvoices));
      return;
    }

    const { error } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', invoiceId);

    if (error) throw error;
  },

  async sendReminder(invoiceId: string): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const { error } = await supabase
      .from('invoices')
      .update({
        last_reminder_sent_at: new Date().toISOString(),
        reminder_count: invoice.reminder_count + 1,
      })
      .eq('id', invoiceId);

    if (error) throw error;
  },
};
