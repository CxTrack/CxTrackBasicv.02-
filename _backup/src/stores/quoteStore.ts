import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '../config/demo.config';
import { MOCK_ADMIN_USER } from '../contexts/AuthContext';
import type { Quote, QuoteItem } from '../types/app.types';

const generateQuoteNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `Q-${timestamp}`;
};

interface QuoteState {
  quotes: Quote[];
  quoteItems: Record<string, QuoteItem[]>;
  loading: boolean;
  error: string | null;
  fetchQuotes: (organizationId?: string) => Promise<void>;
  fetchQuoteItems: (quoteId: string) => Promise<void>;
  createQuote: (quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>) => Promise<Quote | null>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  addQuoteItem: (item: Omit<QuoteItem, 'id' | 'created_at'>) => Promise<QuoteItem | null>;
  updateQuoteItem: (id: string, updates: Partial<QuoteItem>) => Promise<void>;
  deleteQuoteItem: (id: string, quoteId: string) => Promise<void>;
  getQuoteById: (id: string) => Quote | undefined;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  quotes: DEMO_MODE ? loadDemoData<Quote>(DEMO_STORAGE_KEYS.quotes) : [],
  quoteItems: {},
  loading: false,
  error: null,

  fetchQuotes: async (organizationId?: string) => {
    console.log('📄 Fetching quotes...');
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const quotes = loadDemoData<Quote>(DEMO_STORAGE_KEYS.quotes);
      console.log('✅ Loaded demo quotes:', quotes.length);
      set({ quotes, loading: false });
      return;
    }

    try {
      if (!organizationId) {
        set({ quotes: [], loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ quotes: data || [], loading: false });
    } catch (error: any) {
      console.error('❌ Error fetching quotes:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchQuoteItems: async (quoteId: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      set((state) => ({
        quoteItems: {
          ...state.quoteItems,
          [quoteId]: data || [],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createQuote: async (quote) => {
    console.log('📝 Creating quote...', quote);
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const newQuote: Quote = {
          id: generateDemoId('quote'),
          quote_number: generateQuoteNumber(),
          organization_id: '00000000-0000-0000-0000-000000000000',
          ...quote,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Quote;

        console.log('💾 Saving quote to localStorage:', newQuote);

        const quotes = [newQuote, ...get().quotes];
        saveDemoData(DEMO_STORAGE_KEYS.quotes, quotes);

        set({ quotes, loading: false });
        console.log('✅ Quote created successfully:', newQuote.quote_number);

        return newQuote;
      } catch (error: any) {
        console.error('❌ Error creating quote:', error);
        set({ error: error.message, loading: false });
        return null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert([quote])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        quotes: [data, ...state.quotes],
        loading: false,
      }));

      return data;
    } catch (error: any) {
      console.error('❌ Error creating quote:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateQuote: async (id, updates) => {
    console.log('📝 Updating quote:', id);
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const quotes = loadDemoData<Quote>(DEMO_STORAGE_KEYS.quotes);
        const updatedQuotes = quotes.map((q) =>
          q.id === id ? { ...q, ...updates, updated_at: new Date().toISOString() } : q
        );

        saveDemoData(DEMO_STORAGE_KEYS.quotes, updatedQuotes);
        set({ quotes: updatedQuotes, loading: false });
        console.log('✅ Quote updated successfully');
        return;
      } catch (error: any) {
        console.error('❌ Error updating quote:', error);
        set({ error: error.message, loading: false });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        quotes: state.quotes.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('❌ Error updating quote:', error);
      set({ error: error.message, loading: false });
    }
  },

  deleteQuote: async (id) => {
    console.log('🗑️ Deleting quote:', id);
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const quotes = loadDemoData<Quote>(DEMO_STORAGE_KEYS.quotes).filter((q) => q.id !== id);
        saveDemoData(DEMO_STORAGE_KEYS.quotes, quotes);
        set({ quotes, loading: false });
        console.log('✅ Quote deleted successfully');
        return;
      } catch (error: any) {
        console.error('❌ Error deleting quote:', error);
        set({ error: error.message, loading: false });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error('❌ Error deleting quote:', error);
      set({ error: error.message, loading: false });
    }
  },

  addQuoteItem: async (item) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('quote_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        quoteItems: {
          ...state.quoteItems,
          [item.quote_id]: [...(state.quoteItems[item.quote_id] || []), data],
        },
        loading: false,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateQuoteItem: async (id, updates) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return;
    }

    try {
      const { error } = await supabase
        .from('quote_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const newQuoteItems = { ...state.quoteItems };
        Object.keys(newQuoteItems).forEach((quoteId) => {
          newQuoteItems[quoteId] = newQuoteItems[quoteId].map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
        });
        return { quoteItems: newQuoteItems, loading: false };
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteQuoteItem: async (id, quoteId) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      set({ loading: false });
      return;
    }

    try {
      const { error } = await supabase
        .from('quote_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        quoteItems: {
          ...state.quoteItems,
          [quoteId]: state.quoteItems[quoteId]?.filter((item) => item.id !== id) || [],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getQuoteById: (id) => {
    return get().quotes.find((q) => q.id === id);
  },
}));
