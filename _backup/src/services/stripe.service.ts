import { supabase } from '../lib/supabase';

export const stripeService = {
  async createPaymentLink(
    invoiceId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<string> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice_id: invoiceId,
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment link');
    }

    const data = await response.json();
    return data.payment_url;
  },

  async recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    transactionId?: string,
    referenceNumber?: string
  ): Promise<void> {
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        reference_number: referenceNumber,
        status: 'completed',
        payment_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    const { data: invoice } = await supabase
      .from('invoices')
      .select('total_amount, amount_paid')
      .eq('id', invoiceId)
      .single();

    if (!invoice) throw new Error('Invoice not found');

    const newAmountPaid = (invoice.amount_paid || 0) + amount;
    const newAmountDue = invoice.total_amount - newAmountPaid;

    let status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded' = 'partial';
    if (newAmountDue <= 0) {
      status = 'paid';
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', invoiceId);

    if (updateError) throw updateError;
  },

  async getPaymentHistory(invoiceId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
