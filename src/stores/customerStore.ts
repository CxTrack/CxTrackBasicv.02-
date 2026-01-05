import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerNote, CustomerContact, CustomerFile } from '@/types/database.types';
import { useOrganizationStore } from './organizationStore';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '@/config/demo.config';
import { MOCK_ADMIN_USER } from '@/contexts/AuthContext';

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

  contacts: CustomerContact[];
  fetchContacts: (customerId: string) => Promise<void>;
  addContact: (contact: Partial<CustomerContact>) => Promise<void>;

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

    // DEMO MODE
    if (DEMO_MODE) {
      const demoCustomers = loadDemoData<Customer>(DEMO_STORAGE_KEYS.customers);
      set({ customers: demoCustomers, loading: false });
      console.log('✅ Demo customers loaded:', demoCustomers.length);
      return;
    }

    // PRODUCTION MODE
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

    // DEMO MODE
    if (DEMO_MODE) {
      const customers = loadDemoData<Customer>(DEMO_STORAGE_KEYS.customers);
      const customer = customers.find(c => c.id === id);
      set({ currentCustomer: customer || null, loading: false });
      return;
    }

    // PRODUCTION MODE
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
    console.log('👤 Creating customer...', customer);
    set({ loading: true, error: null });

    // DEMO MODE
    if (DEMO_MODE) {
      try {
        const existingCustomers = get().customers;

        const fullName = [
          customer.first_name,
          customer.middle_name,
          customer.last_name
        ].filter(Boolean).join(' ').trim() || 'New Customer';

        if (customer.email && customer.email.trim()) {
          const duplicateByEmail = existingCustomers.find(c =>
            c.email && c.email.toLowerCase().trim() === customer.email!.toLowerCase().trim()
          );

          if (duplicateByEmail) {
            const error = `A customer with email "${customer.email}" already exists`;
            console.error('❌ Duplicate email:', error);
            set({ error, loading: false });
            throw new Error(error);
          }
        }

        const duplicateByNameAndEmail = existingCustomers.find(c =>
          c.name.toLowerCase().trim() === fullName.toLowerCase().trim() &&
          customer.email &&
          c.email &&
          c.email.toLowerCase().trim() === customer.email.toLowerCase().trim()
        );

        if (duplicateByNameAndEmail) {
          const error = 'A customer with this name and email already exists';
          console.error('❌ Duplicate customer:', error);
          set({ error, loading: false });
          throw new Error(error);
        }

        const newCustomer: Customer = {
          id: generateDemoId('customer'),
          name: fullName,
          first_name: customer.first_name || '',
          middle_name: customer.middle_name || null,
          last_name: customer.last_name || '',
          email: customer.email || '',
          phone: customer.phone || null,
          customer_type: customer.customer_type || 'personal',
          company_name: customer.company_name || null,
          status: customer.status || 'Active',
          country: customer.country || 'CA',
          province: customer.province || null,
          city: customer.city || null,
          postal_code: customer.postal_code || null,
          address: customer.address || null,
          customer_category: customer.customer_type === 'business' ? 'Business' : 'Personal',
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'demo-org',
          created_by: 'demo-user',
        } as Customer;

        const updatedCustomers = [newCustomer, ...get().customers];
        saveDemoData(DEMO_STORAGE_KEYS.customers, updatedCustomers);

        set({ customers: updatedCustomers, loading: false });
        console.log('✅ Demo customer created:', newCustomer);

        return newCustomer;
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    }

    // PRODUCTION MODE
    try {
      const existingCustomers = get().customers;
      const userId = MOCK_ADMIN_USER.id;
      const organizationId = MOCK_ADMIN_USER.organization_id;

      const customerCategory = customer.customer_type === 'business' ? 'Business' : 'Personal';

      const fullName = [
        customer.first_name,
        customer.middle_name,
        customer.last_name
      ].filter(Boolean).join(' ').trim() || 'New Customer';

      if (customer.email && customer.email.trim()) {
        const duplicateByEmail = existingCustomers.find(c =>
          c.email && c.email.toLowerCase().trim() === customer.email!.toLowerCase().trim()
        );

        if (duplicateByEmail) {
          const error = `A customer with email "${customer.email}" already exists`;
          console.error('❌ Duplicate email:', error);
          set({ error, loading: false });
          throw new Error(error);
        }
      }

      const duplicateByNameAndEmail = existingCustomers.find(c =>
        c.name.toLowerCase().trim() === fullName.toLowerCase().trim() &&
        customer.email &&
        c.email &&
        c.email.toLowerCase().trim() === customer.email.toLowerCase().trim()
      );

      if (duplicateByNameAndEmail) {
        const error = 'A customer with this name and email already exists';
        console.error('❌ Duplicate customer:', error);
        set({ error, loading: false });
        throw new Error(error);
      }

      const insertData: any = {
        ...customer,
        name: fullName,
        organization_id: organizationId,
        country: customer.country || 'CA',
        status: customer.status || 'Active',
        customer_category: customerCategory,
        total_spent: customer.total_spent || 0,
      };

      if (userId && userId !== '00000000-0000-0000-0000-000000000001') {
        insertData.created_by = userId;
      }

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
      const errorMessage = error.message || 'Failed to create customer';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateCustomer: async (id: string, updates: Partial<Customer>) => {
    set({ loading: true, error: null });

    // DEMO MODE
    if (DEMO_MODE) {
      try {
        const customers = loadDemoData<Customer>(DEMO_STORAGE_KEYS.customers);
        const index = customers.findIndex(c => c.id === id);

        if (index === -1) {
          throw new Error('Customer not found');
        }

        const updatedCustomer = {
          ...customers[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const updatedCustomers = [
          ...customers.slice(0, index),
          updatedCustomer,
          ...customers.slice(index + 1)
        ];

        saveDemoData(DEMO_STORAGE_KEYS.customers, updatedCustomers);

        set((state) => ({
          customers: updatedCustomers,
          currentCustomer: state.currentCustomer?.id === id ? updatedCustomer : state.currentCustomer,
          loading: false
        }));

        console.log('✅ Demo customer updated:', updatedCustomer);
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
      return;
    }

    // PRODUCTION MODE
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

    // DEMO MODE
    if (DEMO_MODE) {
      try {
        const updatedCustomers = get().customers.filter(c => c.id !== id);
        saveDemoData(DEMO_STORAGE_KEYS.customers, updatedCustomers);
        set({ customers: updatedCustomers, loading: false });
        console.log('✅ Demo customer deleted:', id);
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
      return;
    }

    // PRODUCTION MODE
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
    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) return;

    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          ...note,
          organization_id: organizationId,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        notes: [data, ...state.notes],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchContacts: async (customerId: string) => {
    set({ loading: true, error: null });
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
    try {
      const { data, error } = await supabase
        .from('customer_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        contacts: [data, ...state.contacts],
        loading: false,
      }));
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
