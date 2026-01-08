import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { DEMO_MODE, DEMO_STORAGE_KEYS, loadDemoData, saveDemoData, generateDemoId } from '@/config/demo.config';
import { MOCK_ADMIN_USER } from '@/contexts/AuthContext';
import { useOrganizationStore } from './organizationStore';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug' | 'general';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    category: TicketCategory;
    customer_id?: string;
    customer_name: string;
    customer_email?: string;
    organization_name?: string;
    assigned_to?: string;
    assigned_to_name?: string;
    labels: string[];
    due_date?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
    organization_id: string;
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    message: string;
    is_internal: boolean;
    created_at: string;
}

export interface TicketActivity {
    id: string;
    ticket_id: string;
    user_name: string;
    action: string;
    field?: string;
    old_value?: string;
    new_value?: string;
    created_at: string;
}

interface TicketFilters {
    status: TicketStatus | 'all';
    priority: TicketPriority | 'all';
    category: TicketCategory | 'all';
    assignee: string | 'all';
    search: string;
}

interface TicketStore {
    tickets: Ticket[];
    messages: Record<string, TicketMessage[]>;
    activities: Record<string, TicketActivity[]>;
    loading: boolean;
    error: string | null;
    filters: TicketFilters;

    // Actions
    fetchTickets: () => Promise<void>;
    createTicket: (data: Partial<Ticket>) => Promise<Ticket>;
    updateTicket: (id: string, data: Partial<Ticket>) => Promise<Ticket>;
    deleteTicket: (id: string) => Promise<void>;
    updateStatus: (id: string, status: TicketStatus) => Promise<Ticket>;
    assignTicket: (id: string, userId: string, userName: string) => Promise<Ticket>;

    // Messages
    fetchMessages: (ticketId: string) => Promise<TicketMessage[]>;
    addMessage: (ticketId: string, message: string, isInternal?: boolean) => Promise<TicketMessage>;

    // Filters
    setFilter: (key: keyof TicketFilters, value: string) => void;
    resetFilters: () => void;

    // Getters
    getFilteredTickets: () => Ticket[];
    getTicketById: (id: string) => Ticket | undefined;
    getStats: () => { open: number; inProgress: number; urgent: number; avgResponseTime: string };
}

const DEFAULT_FILTERS: TicketFilters = {
    status: 'all',
    priority: 'all',
    category: 'all',
    assignee: 'all',
    search: '',
};

// Demo data for initial tickets
const DEMO_TICKETS: Ticket[] = [
    {
        id: 'TKT-00123456',
        title: 'Billing issue with Enterprise plan',
        description: 'Customer was charged twice for the monthly subscription. They noticed duplicate charges on their credit card statement from January 5th. Need to investigate and issue a refund if confirmed.',
        customer_name: 'Sarah Connor',
        customer_email: 'sarah@cyberdyne.com',
        organization_name: 'Cyberdyne Systems',
        priority: 'high',
        status: 'open',
        category: 'billing',
        assigned_to: 'user_123',
        assigned_to_name: 'John Doe',
        labels: ['billing', 'refund'],
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        organization_id: '00000000-0000-0000-0000-000000000000',
    },
    {
        id: 'TKT-00123457',
        title: 'API rate limit exceeded unexpectedly',
        description: 'Rate limits are triggering despite being well under the documented limit. Customer reports their integration is making approximately 50 requests per minute but hitting 429 errors. Their plan allows 200 requests per minute.',
        customer_name: 'Neo Anderson',
        customer_email: 'neo@matrix.com',
        organization_name: 'Matrix Corp',
        priority: 'medium',
        status: 'in_progress',
        category: 'technical',
        assigned_to: 'user_124',
        assigned_to_name: 'Jane Smith',
        labels: ['api', 'rate-limit'],
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        organization_id: '00000000-0000-0000-0000-000000000000',
    },
    {
        id: 'TKT-00123458',
        title: 'Feature request: Dark mode export',
        description: 'User wants to export PDF reports in dark mode to match their company branding. Currently all exports use light mode styling regardless of theme settings.',
        customer_name: 'Mike Ross',
        customer_email: 'mike@pearsonspecter.com',
        organization_name: 'Pearson Specter',
        priority: 'low',
        status: 'resolved',
        category: 'feature_request',
        labels: ['enhancement', 'pdf'],
        resolved_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        organization_id: '00000000-0000-0000-0000-000000000000',
    },
    {
        id: 'TKT-00123459',
        title: 'Login failures on mobile',
        description: 'iOS app crashing on login screen immediately after entering credentials. Affects version 2.4.1 on iOS 17. Android works fine. Customer has tried reinstalling the app without success.',
        customer_name: 'Bruce Wayne',
        customer_email: 'bruce@wayne.com',
        organization_name: 'Wayne Enterprises',
        priority: 'urgent',
        status: 'open',
        category: 'bug',
        assigned_to: 'user_125',
        assigned_to_name: 'Alfred P.',
        labels: ['mobile', 'critical', 'ios'],
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        organization_id: '00000000-0000-0000-0000-000000000000',
    },
    {
        id: 'TKT-00123460',
        title: 'Cannot upload attachments larger than 5MB',
        description: 'Customer trying to upload 8MB PDF document but getting file size error. They need to attach contracts and invoices which are often larger files.',
        customer_name: 'Tony Stark',
        customer_email: 'tony@stark.com',
        organization_name: 'Stark Industries',
        priority: 'medium',
        status: 'open',
        category: 'technical',
        labels: ['upload', 'file-size'],
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        organization_id: '00000000-0000-0000-0000-000000000000',
    },
];

const DEMO_MESSAGES: Record<string, TicketMessage[]> = {
    'TKT-00123456': [
        {
            id: 'msg_1',
            ticket_id: 'TKT-00123456',
            user_id: 'user_123',
            user_name: 'John Doe',
            message: 'Looking into this now. I can see the duplicate charge in our Stripe dashboard.',
            is_internal: false,
            created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'msg_2',
            ticket_id: 'TKT-00123456',
            user_id: 'user_123',
            user_name: 'John Doe',
            message: 'Internal note: Need to check with finance team before issuing refund.',
            is_internal: true,
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'msg_3',
            ticket_id: 'TKT-00123456',
            user_id: 'customer',
            user_name: 'Sarah Connor',
            message: 'Thanks for looking into this. How long until I can expect the refund?',
            is_internal: false,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
    ],
    'TKT-00123457': [
        {
            id: 'msg_4',
            ticket_id: 'TKT-00123457',
            user_id: 'user_124',
            user_name: 'Jane Smith',
            message: 'I\'ve identified the issue - there\'s a misconfiguration in the rate limiter. Working on a fix now.',
            is_internal: false,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
    ],
};

export const useTicketStore = create<TicketStore>((set, get) => ({
    tickets: [],
    messages: {},
    activities: {},
    loading: false,
    error: null,
    filters: DEFAULT_FILTERS,

    fetchTickets: async () => {
        console.log('🎫 Fetching tickets...');
        set({ loading: true, error: null });

        try {
            if (DEMO_MODE) {
                let tickets = loadDemoData<Ticket>(DEMO_STORAGE_KEYS.tickets);
                if (!tickets || tickets.length === 0) {
                    tickets = DEMO_TICKETS;
                    saveDemoData(DEMO_STORAGE_KEYS.tickets, tickets);
                }
                console.log('✅ Loaded demo tickets:', tickets.length);
                set({ tickets, loading: false });
                return;
            }

            // PRODUCTION MODE
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            if (!organizationId) {
                set({ loading: false });
                return;
            }

            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ tickets: data || [], loading: false });
        } catch (error: any) {
            console.error('❌ Error fetching tickets:', error);
            set({ error: error.message, loading: false });
        }
    },

    createTicket: async (data) => {
        console.log('🎫 Creating ticket:', data);
        set({ loading: true, error: null });

        try {
            if (DEMO_MODE) {
                const newTicket: Ticket = {
                    id: `TKT-${Date.now().toString().slice(-8)}`,
                    title: data.title || 'Untitled Ticket',
                    description: data.description || '',
                    priority: data.priority || 'medium',
                    status: 'open',
                    category: data.category || 'general',
                    customer_name: data.customer_name || 'Unknown Customer',
                    customer_email: data.customer_email,
                    organization_name: data.organization_name,
                    assigned_to: data.assigned_to,
                    assigned_to_name: data.assigned_to_name,
                    labels: data.labels || [],
                    due_date: data.due_date,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    organization_id: MOCK_ADMIN_USER.organization_id,
                };

                const tickets = [newTicket, ...get().tickets];
                saveDemoData(DEMO_STORAGE_KEYS.tickets, tickets);
                set({ tickets, loading: false });

                console.log('✅ Ticket created (demo):', newTicket);
                return newTicket;
            }

            // PRODUCTION MODE
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            const { data: ticketData, error } = await supabase
                .from('support_tickets')
                .insert({
                    ...data,
                    organization_id: organizationId,
                    status: 'open',
                })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                tickets: [ticketData, ...state.tickets],
                loading: false,
            }));

            return ticketData;
        } catch (error: any) {
            console.error('❌ Error creating ticket:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateTicket: async (id, data) => {
        console.log('🎫 Updating ticket:', id, data);

        try {
            if (DEMO_MODE) {
                const updatedTickets = get().tickets.map(t =>
                    t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t
                );
                saveDemoData(DEMO_STORAGE_KEYS.tickets, updatedTickets);
                set({ tickets: updatedTickets });

                const updated = updatedTickets.find(t => t.id === id)!;
                console.log('✅ Ticket updated (demo):', updated);
                return updated;
            }

            const { data: ticketData, error } = await supabase
                .from('support_tickets')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                tickets: state.tickets.map(t => t.id === id ? ticketData : t),
            }));

            return ticketData;
        } catch (error: any) {
            console.error('❌ Error updating ticket:', error);
            throw error;
        }
    },

    deleteTicket: async (id) => {
        console.log('🎫 Deleting ticket:', id);

        try {
            if (DEMO_MODE) {
                const tickets = get().tickets.filter(t => t.id !== id);
                saveDemoData(DEMO_STORAGE_KEYS.tickets, tickets);
                set({ tickets });
                console.log('✅ Ticket deleted (demo)');
                return;
            }

            const { error } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                tickets: state.tickets.filter(t => t.id !== id),
            }));
        } catch (error: any) {
            console.error('❌ Error deleting ticket:', error);
            throw error;
        }
    },

    updateStatus: async (id, status) => {
        const updates: Partial<Ticket> = { status };
        if (status === 'resolved' || status === 'closed') {
            updates.resolved_at = new Date().toISOString();
        }
        return get().updateTicket(id, updates);
    },

    assignTicket: async (id, userId, userName) => {
        return get().updateTicket(id, {
            assigned_to: userId,
            assigned_to_name: userName,
        });
    },

    fetchMessages: async (ticketId) => {
        console.log('💬 Fetching messages for ticket:', ticketId);

        try {
            if (DEMO_MODE) {
                const allMessages = loadDemoData<TicketMessage>(DEMO_STORAGE_KEYS.ticket_messages) || [];
                const ticketMessages = DEMO_MESSAGES[ticketId] || allMessages.filter(m => m.ticket_id === ticketId);

                set((state) => ({
                    messages: { ...state.messages, [ticketId]: ticketMessages },
                }));

                return ticketMessages;
            }

            const { data, error } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            set((state) => ({
                messages: { ...state.messages, [ticketId]: data || [] },
            }));

            return data || [];
        } catch (error: any) {
            console.error('❌ Error fetching messages:', error);
            return [];
        }
    },

    addMessage: async (ticketId, message, isInternal = false) => {
        console.log('💬 Adding message to ticket:', ticketId);

        try {
            if (DEMO_MODE) {
                const newMessage: TicketMessage = {
                    id: generateDemoId('msg'),
                    ticket_id: ticketId,
                    user_id: MOCK_ADMIN_USER.id,
                    user_name: 'Admin User',
                    message,
                    is_internal: isInternal,
                    created_at: new Date().toISOString(),
                };

                const currentMessages = get().messages[ticketId] || [];
                const updatedMessages = [...currentMessages, newMessage];

                set((state) => ({
                    messages: { ...state.messages, [ticketId]: updatedMessages },
                }));

                // Also save to localStorage
                const allMessages = loadDemoData<TicketMessage>(DEMO_STORAGE_KEYS.ticket_messages) || [];
                saveDemoData(DEMO_STORAGE_KEYS.ticket_messages, [...allMessages, newMessage]);

                console.log('✅ Message added (demo):', newMessage);
                return newMessage;
            }

            const { data, error } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    message,
                    is_internal: isInternal,
                })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                messages: {
                    ...state.messages,
                    [ticketId]: [...(state.messages[ticketId] || []), data],
                },
            }));

            return data;
        } catch (error: any) {
            console.error('❌ Error adding message:', error);
            throw error;
        }
    },

    setFilter: (key, value) => {
        set((state) => ({
            filters: { ...state.filters, [key]: value },
        }));
    },

    resetFilters: () => {
        set({ filters: DEFAULT_FILTERS });
    },

    getFilteredTickets: () => {
        const { tickets, filters } = get();

        return tickets.filter(ticket => {
            if (filters.status !== 'all' && ticket.status !== filters.status) return false;
            if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
            if (filters.category !== 'all' && ticket.category !== filters.category) return false;
            if (filters.assignee !== 'all' && ticket.assigned_to !== filters.assignee) return false;
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const matchesTitle = ticket.title.toLowerCase().includes(search);
                const matchesDesc = ticket.description.toLowerCase().includes(search);
                const matchesCustomer = ticket.customer_name.toLowerCase().includes(search);
                const matchesId = ticket.id.toLowerCase().includes(search);
                if (!matchesTitle && !matchesDesc && !matchesCustomer && !matchesId) return false;
            }
            return true;
        });
    },

    getTicketById: (id) => {
        return get().tickets.find(t => t.id === id);
    },

    getStats: () => {
        const tickets = get().tickets;
        const open = tickets.filter(t => t.status === 'open').length;
        const inProgress = tickets.filter(t => t.status === 'in_progress').length;
        const urgent = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;

        // Calculate average response time (simplified)
        const avgResponseTime = '2.4h'; // Would calculate from actual data in production

        return { open, inProgress, urgent, avgResponseTime };
    },
}));
