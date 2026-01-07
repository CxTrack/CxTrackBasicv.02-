// Chat System Types

export interface Message {
    id: string;
    conversation_id?: string;
    content: string;
    sender_id: string;
    message_type?: 'text' | 'image' | 'file' | 'system';
    metadata?: Record<string, unknown>;
    is_edited?: boolean;
    edited_at?: string;
    created_at: string;
    sender?: {
        full_name: string;
        avatar_url?: string;
    };
    reactions?: MessageReaction[];
    attachments?: MessageAttachment[];
}

export interface MessageReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
    user?: {
        full_name: string;
    };
}

export interface MessageAttachment {
    id: string;
    message_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    thumbnail_url?: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    organization_id?: string;
    name?: string;
    is_group?: boolean;
    created_by?: string;
    created_at?: string;
    updated_at: string;
    participants?: ConversationParticipant[];
    last_message?: Message;
    unread_count?: number;
}

export interface ConversationParticipant {
    id?: string;
    conversation_id?: string;
    user_id?: string;
    joined_at?: string;
    last_read_at?: string;
    is_muted?: boolean;
    user: {
        full_name: string;
        avatar_url?: string;
        status?: 'online' | 'offline' | 'away';
    };
}

export interface ChatSettings {
    id?: string;
    user_id?: string;
    notifications_enabled: boolean;
    sound_enabled: boolean;
    desktop_notifications: boolean;
    show_read_receipts: boolean;
    show_typing_indicators: boolean;
    compact_mode: boolean;
    enter_to_send: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface MockUser {
    id: string;
    full_name: string;
    status: 'Online' | 'Offline' | 'Away';
    avatar_url?: string;
}

// Default chat settings
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
    notifications_enabled: true,
    sound_enabled: true,
    desktop_notifications: true,
    show_read_receipts: true,
    show_typing_indicators: true,
    compact_mode: false,
    enter_to_send: true,
};

// Common emoji reactions
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

// Full emoji set for picker (organized by category)
export const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
    'Objects': ['🎉', '🎊', '🎁', '🎈', '🔥', '⭐', '✨', '💫', '🌟', '💯', '💢', '💥', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'],
};
