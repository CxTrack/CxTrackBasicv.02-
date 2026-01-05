import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '../config/demo.config';
import { MOCK_ADMIN_USER } from '../contexts/AuthContext';
import type { Invoice, InvoiceItem, Payment } from '../types/app.types';

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${timestamp}`;
};

interface InvoiceState {
  invoices: Invoice[];
  invoiceItems: Record<string, InvoiceItem[]>;
  payments: Record<string, Payment[]>;
  loading: boolean;
  error: string | null;
  fetchInvoices: (organizationId?: string) => Promise<void>;
  fetchInvoiceItems: (invoiceId: string) => Promise<void>;
  fetchPayments: (invoiceId: string) => Promise<void>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => Promise<Invoice | null>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addInvoiceItem: (item: Omit<InvoiceItem, 'id' | 'created_at'>) => Promise<InvoiceItem | null>;
  updateInvoiceItem: (id: string, updates: Partial<InvoiceItem>) => Promise<void>;
  deleteInvoiceItem: (id: string, invoiceId: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<Payment | null>;
  getInvoiceById: (id: string) => Invoice | undefined;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: DEMO_MODE ? loadDemoData<Invoice>(DEMO_STORAGE_KEYS.invoices) : [],
  invoiceItems: {},
  payments: {},
  loading: false,
  error: null,

  fetchInvoices: async (organizationId?: string) => {
    console.log('📄 Fetching invoices...');
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const invoices = loadDemoData<Invoice>(DEMO_STORAGE_KEYS.invoices);
      console.log('✅ Loaded demo invoices:', invoices.length);
      set({ invoices, loading: false });
      return;
    }

    try {
      if (!organizationId) {
        set({ invoices: [], loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ invoices: data || [], loading: false });
    } catch (error: any) {
      console.error('❌ Error fetching invoices:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchInvoiceItems: async (invoiceId: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      set((state) => ({
        invoiceItems: {
          ...state.invoiceItems,
          [invoiceId]: data || [],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPayments: async (invoiceId: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      set((state) => ({
        payments: {
          ...state.payments,
          [invoiceId]: data || [],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createInvoice: async (invoice) => {
    console.log('📝 Creating invoice...', invoice);
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const newInvoice: Invoice = {
          id: generateDemoId('invoice'),
          invoice_number: generateInvoiceNumber(),
          organization_id: '00000000-0000-0000-0000-000000000000',
          ...invoice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Invoice;

        console.log('💾 Saving invoice to localStorage:', newInvoice);

        const invoices = [newInvoice, ...get().invoices];
        saveDemoData(DEMO_STORAGE_KEYS.invoices, invoices);

        set({ invoices, loading: false });
        console.log('✅ Invoice created successfully:', newInvoice.invoice_number);

        return newInvoice;
      } catch (error: any) {
        console.error('❌ Error creating invoice:', error);
        set({ error: error.message, loading: false });
        return null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoice])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        invoices: [data, ...state.invoices],
        loading: false,
      }));

      return data;
    } catch (error: any) {
      console.error('❌ Error creating invoice:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateInvoice: async (id, updates) => {
    console.log('📝 Updating invoice:', id);
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const invoices = get().invoices;
        const updatedInvoices = invoices.map((inv) =>
          inv.id === id ? { ...inv, ...updates, updated_at: new Date().toISOString() } : inv
        );

        saveDemoData(DEMO_STORAGE_KEYS.invoices, updatedInvoices);
        set({ invoices: updatedInvoices, loading: false });
        console.log('✅ Invoice updated successfully');
        return;
      } catch (error: any) {
        console.error('❌ Error updating invoice:', error);
        set({ error: error.message, loading: false });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...updates } : inv
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('❌ Error updating invoice:', error);
      set({ error: error.message, loading: false });
    }
  },

  deleteInvoice: async (id) => {
    console.log('🗑️ Deleting invoice:', id);
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const invoices = get().invoices.filter((inv) => inv.id !== id);
        saveDemoData(DEMO_STORAGE_KEYS.invoices, invoices);
        set({ invoices, loading: false });
        console.log('✅ Invoice deleted successfully');
        return;
      } catch (error: any) {
        console.error('❌ Error deleting invoice:', error);
        set({ error: error.message, loading: false });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error('❌ Error deleting invoice:', error);
      set({ error: error.message, loading: false });
    }
  },

  addInvoiceItem: async (item) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        invoiceItems: {
          ...state.invoiceItems,
          [item.invoice_id]: [...(state.invoiceItems[item.invoice_id] || []), data],
        },
        loading: false,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateInvoiceItem: async (id, updates) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return;
    }

    try {
      const { error } = await supabase
        .from('invoice_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const newInvoiceItems = { ...state.invoiceItems };
        Object.keys(newInvoiceItems).forEach((invoiceId) => {
          newInvoiceItems[invoiceId] = newInvoiceItems[invoiceId].map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
        });
        return { invoiceItems: newInvoiceItems, loading: false };
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteInvoiceItem: async (id, invoiceId) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return;
    }

    try {
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        invoiceItems: {
          ...state.invoiceItems,
          [invoiceId]: state.invoiceItems[invoiceId]?.filter((item) => item.id !== id) || [],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addPayment: async (payment) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        payments: {
          ...state.payments,
          [payment.invoice_id]: [...(state.payments[payment.invoice_id] || []), data],
        },
        loading: false,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  getInvoiceById: (id) => {
    return get().invoices.find((inv) => inv.id === id);
  },
}));
