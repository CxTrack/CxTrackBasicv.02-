import { createClient } from '@supabase/supabase-js';
import { DEMO_MODE } from '@/config/demo.config';

const createMockSupabaseClient = () => {
  const createChainableQuery = () => {
    const chainable: any = {
      select: function () { return this; },
      insert: function () { return this; },
      update: function () { return this; },
      delete: function () { return this; },
      upsert: function () { return this; },
      eq: function () { return this; },
      neq: function () { return this; },
      gt: function () { return this; },
      gte: function () { return this; },
      lt: function () { return this; },
      lte: function () { return this; },
      like: function () { return this; },
      ilike: function () { return this; },
      is: function () { return this; },
      in: function () { return this; },
      contains: function () { return this; },
      containedBy: function () { return this; },
      range: function () { return this; },
      order: function () { return this; },
      limit: function () { return this; },
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
      catch: (reject: any) => Promise.resolve({ data: [], error: null }),
    };
    return chainable;
  };

  return {
    from: (table: string) => createChainableQuery(),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => { } }) }),
      subscribe: () => ({ unsubscribe: () => { } }),
      unsubscribe: () => { },
    }),
  };
};

let supabaseInstance: any = null;

if (DEMO_MODE) {
  console.log('🧪 DEMO MODE - Using mock Supabase client with localStorage');
  supabaseInstance = createMockSupabaseClient();
} else {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase environment variables - using mock client');
    supabaseInstance = createMockSupabaseClient();
  } else {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
      console.log('🔗 Supabase client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      supabaseInstance = createMockSupabaseClient();
    }
  }
}

export const supabase = supabaseInstance;

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    if (!supabase || DEMO_MODE) {
      return null;
    }
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// Helper function to get user's profile
export const getUserProfile = async (userId: string) => {
  try {
    if (!supabase || DEMO_MODE) {
      return null;
    }
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
};

// Helper function to get user's organization memberships
export const getUserOrganizations = async (userId: string) => {
  try {
    if (!supabase || DEMO_MODE) {
      return [];
    }
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get user organizations:', error);
    return [];
  }
};
