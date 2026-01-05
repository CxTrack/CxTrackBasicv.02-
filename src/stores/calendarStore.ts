import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../types/database.types';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId, getDemoOrganizationId, getDemoUserId } from '@/config/demo.config';

interface CalendarPreferences {
  default_view: 'month' | 'week' | 'day' | 'agenda';
  week_start_day: number;
  time_format: '12h' | '24h';
  show_weekends: boolean;
  show_agenda_panel: boolean;
  agenda_panel_position: 'left' | 'right';
  working_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  email_reminders: boolean;
  sms_reminders: boolean;
  event_colors: {
    appointment: string;
    meeting: string;
    call: string;
    task: string;
    reminder: string;
  };
}

interface CalendarState {
  events: CalendarEvent[];
  preferences: CalendarPreferences | null;
  loading: boolean;
  error: string | null;
  fetchEvents: (organizationId?: string, from?: Date, to?: Date) => Promise<void>;
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsByCustomer: (customerId: string) => CalendarEvent[];
  getEventsByDate: (date: string) => CalendarEvent[];
  createEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  fetchPreferences: (userId: string) => Promise<void>;
  updatePreferences: (userId: string, preferences: Partial<CalendarPreferences>) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: DEMO_MODE ? loadDemoData(DEMO_STORAGE_KEYS.calendar) : [],
  preferences: null,
  loading: false,
  error: null,

  fetchEvents: async (organizationId?: string, from?: Date, to?: Date) => {
    console.log('📅 Fetching calendar events...');
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const events = loadDemoData(DEMO_STORAGE_KEYS.calendar);
        console.log('✅ Loaded events from localStorage:', events.length);
        set({ events, loading: false });
        return;
      }

      let query = supabase
        .from('calendar_events')
        .select('*');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      if (from) {
        query = query.gte('start_time', from.toISOString());
      }

      if (to) {
        query = query.lte('start_time', to.toISOString());
      }

      const { data, error } = await query.order('start_time', { ascending: true });

      if (error) throw error;
      console.log('✅ Loaded events from database:', data?.length || 0);
      set({ events: data || [], loading: false });
    } catch (error: any) {
      console.error('❌ Error fetching events:', error);
      set({ error: error.message, loading: false });
    }
  },

  getEventById: (id) => {
    return get().events.find((e) => e.id === id);
  },

  getEventsByCustomer: (customerId) => {
    return get().events.filter(event => event.customer_id === customerId);
  },

  getEventsByDate: (date) => {
    return get().events.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0];
      return eventDate === date;
    });
  },

  createEvent: async (event) => {
    console.log('📅 Creating calendar event:', event);
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const newEvent: CalendarEvent = {
          ...event,
          id: generateDemoId('event'),
          organization_id: event.organization_id || getDemoOrganizationId(),
          user_id: event.user_id || getDemoUserId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CalendarEvent;

        const events = [newEvent, ...get().events];
        saveDemoData(DEMO_STORAGE_KEYS.calendar, events);

        set({ events, loading: false });
        console.log('✅ Event created (demo mode):', newEvent);
        return newEvent;
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        events: [...state.events, data],
        loading: false,
      }));

      console.log('✅ Event created (database):', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error creating event:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateEvent: async (id, updates) => {
    console.log('📅 Updating event:', id, updates);
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const existingEvent = get().events.find(e => e.id === id);

        if (!existingEvent) {
          throw new Error(`Event ${id} not found`);
        }

        console.log('📝 Existing event:', existingEvent);

        const updatedEvents = get().events.map((e) =>
          e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
        );

        console.log('💾 Saving updated events to localStorage...');
        saveDemoData(DEMO_STORAGE_KEYS.calendar, updatedEvents);

        const savedEvents = loadDemoData(DEMO_STORAGE_KEYS.calendar);
        const savedEvent = savedEvents.find((e: CalendarEvent) => e.id === id);
        console.log('✅ Event after save:', savedEvent);

        set({ events: updatedEvents, loading: false });

        const updatedEvent = updatedEvents.find(e => e.id === id);
        console.log('✅ Event updated successfully:', updatedEvent);
        return;
      }

      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
        loading: false,
      }));
      console.log('✅ Event updated (database)');
    } catch (error: any) {
      console.error('❌ Error updating event:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    console.log('📅 Deleting event:', id);
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const events = get().events.filter((e) => e.id !== id);
        saveDemoData(DEMO_STORAGE_KEYS.calendar, events);
        set({ events, loading: false });
        console.log('✅ Event deleted (demo mode)');
        return;
      }

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        loading: false,
      }));
      console.log('✅ Event deleted (database)');
    } catch (error: any) {
      console.error('❌ Error deleting event:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchPreferences: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('calendar_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        set({ preferences: data as any });
      } else {
        set({
          preferences: {
            default_view: 'week',
            week_start_day: 0,
            time_format: '12h',
            show_weekends: true,
            show_agenda_panel: true,
            agenda_panel_position: 'right',
            working_hours: {
              enabled: false,
              start: '09:00',
              end: '17:00',
            },
            email_reminders: true,
            sms_reminders: false,
            event_colors: {
              appointment: '#6366f1',
              meeting: '#10b981',
              call: '#f59e0b',
              task: '#8b5cf6',
              reminder: '#ec4899',
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch preferences:', error);
    }
  },

  updatePreferences: async (userId, preferences) => {
    try {
      const { error } = await supabase
        .from('calendar_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
        });

      if (error) throw error;

      set((state) => ({
        preferences: state.preferences
          ? { ...state.preferences, ...preferences }
          : null,
      }));
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
    }
  },
}));
