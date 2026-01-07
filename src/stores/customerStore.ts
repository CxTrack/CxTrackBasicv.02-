import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerNote, CustomerContact, CustomerFile } from '@/types/database.types';
import { useOrganizationStore } from './organizationStore';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '@/config/demo.config';

interface CustomerStore {
  customers: Customer[];
  currentCustomer: Customer | null;
  loading: boolean;
  error: string | null;

  fetchCustomers: () => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  createCustomer: (customer: Partial<Customer>) => Promise<Customer | null>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  notes: CustomerNote[];
  fetchNotes: (customerId: string) => Promise<void>;
  addNote: (note: Partial<CustomerNote>) => Promise<void>;
  updateNote: (id: string, updates: Partial<CustomerNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  contacts: CustomerContact[];
  fetchContacts: (customerId: string) => Promise<void>;
  addContact: (contact: Partial<CustomerContact>) => Promise<void>;
  updateContact: (id: string, updates: Partial<CustomerContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  files: CustomerFile[];
  fetchFiles: (customerId: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  currentCustomer: null,
  loading: false,
  error: null,
  notes: [],
  contacts: [],
  files: [],

  fetchCustomers: async () => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const demoCustomers = loadDemoData<Customer>(DEMO_STORAGE_KEYS.customers);
      set({ customers: demoCustomers, loading: false });
      return;
    }

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ customers: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCustomerById: async (id: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const customers = loadDemoData<Customer>(DEMO_STORAGE_KEYS.customers);
      const customer = customers.find(c => c.id === id);
      set({ currentCustomer: customer || null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      set({ currentCustomer: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getCustomerById: (id: string) => {
    const state = get();
    return state.customers.find(customer => customer.id === id);
  },

  createCustomer: async (customer: Partial<Customer>) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const fullName = [
          customer.first_name,
          customer.middle_name,
          customer.last_name
        ].filter(Boolean).join(' ').trim() || 'New Customer';

        const newCustomer: Customer = {
          id: generateDemoId('customer'),
          name: fullName,
          first_name: customer.first_name || '',
          middle_name: customer.middle_name || null,
          last_name: customer.last_name || '',
          email: customer.email || '',
          phone: customer.phone || null,
          customer_type: (customer.customer_type as any) || 'personal',
          company: customer.company || null,
          status: customer.status || 'Active',
          country: customer.country || 'CA',
          state: customer.state || null,
          city: customer.city || null,
          postal_code: customer.postal_code || null,
          address: customer.address || null,
          customer_category: customer.customer_category || (customer.customer_type === 'business' ? 'Business' : 'Personal'),
          type: customer.type || (customer.customer_type === 'business' ? 'Business' : 'Individual'),
          priority: customer.priority || 'Medium',
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: customer.organization_id || 'demo-org',
          created_by: customer.created_by || 'demo-user',
          custom_fields: customer.custom_fields || {},
          tags: customer.tags || [],
        } as Customer;

        const updatedCustomers = [newCustomer, ...get().customers];
        saveDemoData(DEMO_STORAGE_KEYS.customers, updatedCustomers);
        set({ customers: updatedCustomers, loading: false });
        return newCustomer;
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    }

    try {
      const organizationId = customer.organization_id || useOrganizationStore.getState().getOrganizationId();
      const fullName = [
        customer.first_name,
        customer.middle_name,
        customer.last_name
      ].filter(Boolean).join(' ').trim() || 'New Customer';

      const insertData: any = {
        ...customer,
        name: fullName,
        organization_id: organizationId,
        country: customer.country || 'CA',
        status: customer.status || 'Active',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        customers: [data, ...state.customers],
        loading: false,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCustomer: async (id: string, updates: Partial<Customer>) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const customers = loadDemoData<Customer>(DEMO_STORAGE_KEYS.customers);
        const index = customers.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Customer not found');

        const updatedCustomer = {
          ...customers[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const updatedCustomers = [...customers];
        updatedCustomers[index] = updatedCustomer;
        saveDemoData(DEMO_STORAGE_KEYS.customers, updatedCustomers);

        set((state) => ({
          customers: updatedCustomers,
          currentCustomer: state.currentCustomer?.id === id ? updatedCustomer : state.currentCustomer,
          loading: false
        }));
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? data : c)),
        currentCustomer: state.currentCustomer?.id === id ? data : state.currentCustomer,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const updatedCustomers = get().customers.filter(c => c.id !== id);
      saveDemoData(DEMO_STORAGE_KEYS.customers, updatedCustomers);
      set({ customers: updatedCustomers, loading: false });
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchNotes: async (customerId: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const allNotes = loadDemoData<CustomerNote>(DEMO_STORAGE_KEYS.customer_notes);
      set({ notes: allNotes.filter(n => n.customer_id === customerId), loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ notes: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addNote: async (note: Partial<CustomerNote>) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const newNote: CustomerNote = {
        id: generateDemoId('note'),
        customer_id: note.customer_id!,
        content: note.content || '',
        organization_id: 'demo-org',
        user_id: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as CustomerNote;

      const allNotes = loadDemoData<CustomerNote>(DEMO_STORAGE_KEYS.customer_notes);
      saveDemoData(DEMO_STORAGE_KEYS.customer_notes, [newNote, ...allNotes]);
      set((state) => ({ notes: [newNote, ...state.notes], loading: false }));
      return;
    }

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({ ...note, organization_id: organizationId, user_id: user?.id })
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ notes: [data, ...state.notes], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateNote: async (id: string, updates: Partial<CustomerNote>) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const allNotes = loadDemoData<CustomerNote>(DEMO_STORAGE_KEYS.customer_notes);
      const index = allNotes.findIndex(n => n.id === id);
      if (index !== -1) {
        const updatedNote = { ...allNotes[index], ...updates, updated_at: new Date().toISOString() };
        allNotes[index] = updatedNote;
        saveDemoData(DEMO_STORAGE_KEYS.customer_notes, allNotes);
        set((state) => ({ notes: state.notes.map(n => n.id === id ? updatedNote : n), loading: false }));
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ notes: state.notes.map(n => n.id === id ? data : n), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteNote: async (id: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const allNotes = loadDemoData<CustomerNote>(DEMO_STORAGE_KEYS.customer_notes);
      const filtered = allNotes.filter(n => n.id !== id);
      saveDemoData(DEMO_STORAGE_KEYS.customer_notes, filtered);
      set((state) => ({ notes: state.notes.filter(n => n.id !== id), loading: false }));
      return;
    }

    try {
      const { error } = await supabase.from('customer_notes').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ notes: state.notes.filter(n => n.id !== id), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Contacts management with demo mode support
  fetchContacts: async (customerId: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const allContacts = loadDemoData<CustomerContact>(DEMO_STORAGE_KEYS.contacts);
      const customerContacts = allContacts
        .filter(c => c.customer_id === customerId)
        .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      set({ contacts: customerContacts, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      set({ contacts: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addContact: async (contact: Partial<CustomerContact>) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const newContact: CustomerContact = {
        id: generateDemoId('contact'),
        customer_id: contact.customer_id!,
        name: contact.name || '',
        title: contact.title || null,
        email: contact.email || null,
        phone: contact.phone || null,
        is_primary: contact.is_primary || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const allContacts = loadDemoData<CustomerContact>(DEMO_STORAGE_KEYS.contacts);
      saveDemoData(DEMO_STORAGE_KEYS.contacts, [newContact, ...allContacts]);
      set((state) => ({ contacts: [newContact, ...state.contacts], loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.from('customer_contacts').insert(contact).select().single();
      if (error) throw error;
      set((state) => ({ contacts: [data, ...state.contacts], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateContact: async (id: string, updates: Partial<CustomerContact>) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const allContacts = loadDemoData<CustomerContact>(DEMO_STORAGE_KEYS.contacts);
      const index = allContacts.findIndex(c => c.id === id);
      if (index !== -1) {
        const updatedContact = { ...allContacts[index], ...updates, updated_at: new Date().toISOString() };
        allContacts[index] = updatedContact;
        saveDemoData(DEMO_STORAGE_KEYS.contacts, allContacts);
        set((state) => ({
          contacts: state.contacts.map(c => c.id === id ? updatedContact : c),
          loading: false
        }));
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customer_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ contacts: state.contacts.map(c => c.id === id ? data : c), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteContact: async (id: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const allContacts = loadDemoData<CustomerContact>(DEMO_STORAGE_KEYS.contacts);
      const filtered = allContacts.filter(c => c.id !== id);
      saveDemoData(DEMO_STORAGE_KEYS.contacts, filtered);
      set((state) => ({ contacts: state.contacts.filter(c => c.id !== id), loading: false }));
      return;
    }

    try {
      const { error } = await supabase.from('customer_contacts').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ contacts: state.contacts.filter(c => c.id !== id), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchFiles: async (customerId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('customer_files')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ files: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
