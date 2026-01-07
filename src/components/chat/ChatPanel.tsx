import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, ArrowLeft, Send, Plus, X } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';



interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    sender?: {
        full_name: string;
    };
}

interface Conversation {
    id: string;
    name?: string;
    updated_at: string;
    participants?: {
        user: {
            full_name: string;
        };
    }[];
}

export const ChatPanel = () => {
    const { user } = useAuthContext();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            fetchConversations();
            // subscribeToConversations();
        }
    }, [user]);

    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation.id);
            // subscribeToMessages(activeConversation.id);
        }
    }, [activeConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        if (!user) return;

        // This is a simplified query. In a real app you'd join with participants.
        const { data, error } = await supabase
            .from('conversations')
            .select(`
        *,
        participants:conversation_participants(
          user:user_profiles(full_name)
        )
      `)
            .order('updated_at', { ascending: false });

        if (!error && data) {
            setConversations(data);
        }
    };

    const loadMessages = async (conversationId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
        *,
        sender:user_profiles(full_name)
      `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || !activeConversation) return;

        const messageContent = newMessage;
        setNewMessage(''); // Optimistic clear

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: activeConversation.id,
                sender_id: user.id,
                content: messageContent,
            });

        if (error) {
            console.error('Error sending message:', error);
            // Optionally restore message
            setNewMessage(messageContent);
        } else {
            // Refresh messages
            loadMessages(activeConversation.id);
        }
    };

    const handleStartNewConversation = () => {
        console.log("Start new conversation logic here");
        // Implementation depends on how you select users
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="
          fixed bottom-8 right-8 w-16 h-16
          bg-gradient-to-br from-blue-500 to-blue-600
          text-white rounded-[24px] shadow-2xl
          hover:shadow-blue-500/50 hover:scale-105
          transition-all duration-300 ease-out
          flex items-center justify-center
          backdrop-blur-xl bg-opacity-90
          border border-white/10
          z-50
        "
            >
                <MessageCircle className="w-7 h-7" strokeWidth={2} />
                {unreadCount > 0 && (
                    <div className="
            absolute -top-2 -right-2 
            min-w-[24px] h-6 px-2
            bg-red-500 text-white 
            text-xs font-semibold 
            rounded-full 
            flex items-center justify-center
            shadow-lg
            animate-pulse
          ">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </button>
        );
    }

    return (
        <div className="
      fixed bottom-8 right-8 
      w-[420px] h-[680px]
      bg-white/80 dark:bg-gray-900/80
      backdrop-blur-2xl
      rounded-[32px]
      shadow-2xl
      border border-gray-200/50 dark:border-gray-700/50
      overflow-hidden
      z-50
      transition-all duration-500 ease-out
      transform scale-100
    ">

            {!activeConversation ? (
                // Conversations List
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="
            px-8 pt-8 pb-6
            border-b border-gray-200/50 dark:border-gray-700/50
            backdrop-blur-xl
          ">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                Messages
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="
                  w-8 h-8 rounded-full
                  hover:bg-gray-200/60 dark:hover:bg-gray-700/60
                  transition-all duration-200
                  flex items-center justify-center
                "
                            >
                                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="
              relative
              bg-gray-100/60 dark:bg-gray-800/60
              rounded-[16px]
              overflow-hidden
              transition-all duration-200
              hover:bg-gray-100 dark:hover:bg-gray-800
            ">
                            <input
                                type="text"
                                placeholder="Search"
                                className="
                  w-full px-4 py-3
                  bg-transparent
                  text-sm text-gray-900 dark:text-white
                  placeholder-gray-500
                  outline-none
                "
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-4 py-2 space-y-1">
                            {conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        setActiveConversation(conv);
                                        loadMessages(conv.id);
                                    }}
                                    className="
                    w-full p-4 rounded-[20px]
                    hover:bg-gray-100/60 dark:hover:bg-gray-800/60
                    transition-all duration-200
                    flex items-center gap-4
                    group
                  "
                                >
                                    {/* Avatar */}
                                    <div className="
                    relative flex-shrink-0
                    w-14 h-14 
                    bg-gradient-to-br from-blue-500 to-purple-600
                    rounded-full
                    flex items-center justify-center
                    text-white text-lg font-semibold
                    shadow-lg
                  ">
                                        {conv.participants?.[0]?.user?.full_name?.charAt(0) || 'U'}
                                        <div className="
                      absolute -bottom-0.5 -right-0.5
                      w-4 h-4 bg-green-500 
                      rounded-full
                      border-2 border-white dark:border-gray-900
                    " />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                {conv.name || conv.participants?.[0]?.user?.full_name || 'Unknown'}
                                            </p>
                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                {formatTime(conv.updated_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            Last message preview...
                                        </p>
                                    </div>

                                    {/* Unread Badge */}
                                    <div className="
                    w-2 h-2 
                    bg-blue-500 
                    rounded-full
                    flex-shrink-0
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                  " />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Message Button */}
                    <div className="p-6">
                        <button
                            onClick={handleStartNewConversation}
                            className="
                w-full py-4
                bg-blue-500 hover:bg-blue-600
                text-white font-semibold
                rounded-[16px]
                transition-all duration-200
                hover:shadow-lg hover:shadow-blue-500/50
                flex items-center justify-center gap-2
              "
                        >
                            <Plus className="w-5 h-5" strokeWidth={2.5} />
                            New Message
                        </button>
                    </div>
                </div>
            ) : (
                // Active Conversation
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="
            px-6 py-5
            border-b border-gray-200/50 dark:border-gray-700/50
            backdrop-blur-xl
            flex items-center gap-4
          ">
                        <button
                            onClick={() => setActiveConversation(null)}
                            className="
                w-8 h-8 rounded-full
                hover:bg-gray-200/60 dark:hover:bg-gray-700/60
                transition-all duration-200
                flex items-center justify-center
              "
                        >
                            <ArrowLeft className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
                        </button>

                        <div className="
              w-11 h-11 
              bg-gradient-to-br from-blue-500 to-purple-600
              rounded-full
              flex items-center justify-center
              text-white font-semibold
              shadow-lg
            ">
                            {activeConversation.name?.charAt(0) || activeConversation.participants?.[0]?.user?.full_name?.charAt(0) || 'U'}
                        </div>

                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {activeConversation.name || activeConversation.participants?.[0]?.user?.full_name || 'Direct Message'}
                            </p>
                            <p className="text-xs text-gray-500">Active now</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                        {messages.map((msg, idx) => {
                            const isOwn = msg.sender_id === user?.id;
                            const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar (only show if sender changed) */}
                                    {!isOwn && showAvatar ? (
                                        <div className="
                      w-8 h-8 
                      bg-gradient-to-br from-blue-500 to-purple-600
                      rounded-full
                      flex items-center justify-center
                      text-white text-xs font-semibold
                      flex-shrink-0
                    ">
                                            {msg.sender?.full_name?.charAt(0) || 'U'}
                                        </div>
                                    ) : (
                                        !isOwn && <div className="w-8" /> // Spacer for alignment
                                    )}

                                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                        {/* Message Bubble */}
                                        <div className={`
                      px-5 py-3 rounded-[20px]
                      ${isOwn
                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                            }
                      transition-all duration-200
                    `}>
                                            <p className="text-[15px] leading-relaxed">
                                                {msg.content}
                                            </p>
                                        </div>

                                        {/* Timestamp */}
                                        <span className="text-[11px] text-gray-500 mt-1 px-2">
                                            {new Date(msg.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="
            px-6 py-5
            border-t border-gray-200/50 dark:border-gray-700/50
            backdrop-blur-xl
          ">
                        <div className="
              flex items-center gap-3
              bg-gray-100/60 dark:bg-gray-800/60
              rounded-[24px]
              px-5 py-3
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200
            ">
                            <input
                                type="text"
                                placeholder="Message"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                className="
                  flex-1 bg-transparent
                  text-[15px] text-gray-900 dark:text-white
                  placeholder-gray-500
                  outline-none
                "
                            />
                            <button
                                onClick={sendMessage}
                                className="
                  w-8 h-8 
                  bg-blue-500 hover:bg-blue-600
                  text-white 
                  rounded-full
                  flex items-center justify-center
                  transition-all duration-200
                  hover:scale-110
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                                disabled={!newMessage.trim()}
                            >
                                <Send className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const formatTime = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString();
};

// Export legacy name for backwards compatibility
export const AppleChatPanel = ChatPanel;
