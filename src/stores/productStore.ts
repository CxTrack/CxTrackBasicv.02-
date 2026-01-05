import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/app.types';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '@/config/demo.config';
import { MOCK_ADMIN_USER } from '@/contexts/AuthContext';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (organizationId?: string) => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: DEMO_MODE ? loadDemoData<Product>(DEMO_STORAGE_KEYS.products) : [],
  loading: false,
  error: null,

  fetchProducts: async (organizationId?: string) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      const demoProducts = loadDemoData<Product>(DEMO_STORAGE_KEYS.products);
      console.log('📦 Loaded demo products:', demoProducts);
      set({ products: demoProducts, loading: false });
      return;
    }

    try {
      let query = supabase.from('products').select('*');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      set({ products: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createProduct: async (product) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const newProduct: Product = {
          id: generateDemoId('product'),
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updatedProducts = [newProduct, ...get().products];
        saveDemoData(DEMO_STORAGE_KEYS.products, updatedProducts);

        set({
          products: updatedProducts,
          loading: false
        });

        console.log('✅ Demo product created:', newProduct);
        return newProduct;
      } catch (error: any) {
        console.error('Error creating demo product:', error);
        set({ error: error.message, loading: false });
        return null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        products: [data, ...state.products],
        loading: false,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateProduct: async (id, updates) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const products = get().products;
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
          throw new Error('Product not found');
        }

        const updatedProduct = {
          ...products[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const updatedProducts = [
          ...products.slice(0, index),
          updatedProduct,
          ...products.slice(index + 1)
        ];

        saveDemoData(DEMO_STORAGE_KEYS.products, updatedProducts);

        set({
          products: updatedProducts,
          loading: false
        });

        console.log('✅ Demo product updated:', updatedProduct);
      } catch (error: any) {
        console.error('Error updating demo product:', error);
        set({ error: error.message, loading: false });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });

    if (DEMO_MODE) {
      try {
        const updatedProducts = get().products.filter(p => p.id !== id);
        saveDemoData(DEMO_STORAGE_KEYS.products, updatedProducts);

        set({
          products: updatedProducts,
          loading: false
        });

        console.log('✅ Demo product deleted');
      } catch (error: any) {
        console.error('Error deleting demo product:', error);
        set({ error: error.message, loading: false });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },
}));
