// Mock data for Chat system (used when Supabase is not connected or in demo mode)

import { Conversation, Message, MockUser } from '@/types/chat.types';

export const MOCK_USERS: MockUser[] = [
    { id: 'mock-1', full_name: 'Sarah Wilson', status: 'Online' },
    { id: 'mock-2', full_name: 'Mike Chen', status: 'Offline' },
    { id: 'mock-3', full_name: 'Jessica Taylor', status: 'Online' },
    { id: 'mock-4', full_name: 'David Miller', status: 'Away' },
    { id: 'mock-5', full_name: 'Emma Davis', status: 'Online' },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'conv-1',
        updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        participants: [{ user: { full_name: 'Sarah Wilson', status: 'online' } }],
    },
    {
        id: 'conv-2',
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        participants: [{ user: { full_name: 'Mike Chen', status: 'offline' } }],
    },
    {
        id: 'conv-3',
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        participants: [{ user: { full_name: 'Jessica Taylor', status: 'online' } }],
    },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
    'conv-1': [
        {
            id: 'm1',
            content: 'Hey, thanks for the update!',
            sender_id: 'mock-1',
            created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
            sender: { full_name: 'Sarah Wilson' },
            reactions: [{ id: 'r1', message_id: 'm1', user_id: 'user-me', emoji: '👍', created_at: new Date().toISOString() }],
        },
        {
            id: 'm2',
            content: 'No problem, let me know if you need anything else.',
            sender_id: 'user-me',
            created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
            sender: { full_name: 'Me' },
        },
        {
            id: 'm3',
            content: 'Will do! 🎉',
            sender_id: 'mock-1',
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            sender: { full_name: 'Sarah Wilson' },
        },
    ],
    'conv-2': [
        {
            id: 'm4',
            content: 'Can we reschedule our meeting?',
            sender_id: 'mock-2',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            sender: { full_name: 'Mike Chen' },
        },
    ],
    'conv-3': [
        {
            id: 'm5',
            content: 'The new design looks great.',
            sender_id: 'mock-3',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            sender: { full_name: 'Jessica Taylor' },
        },
    ],
};
