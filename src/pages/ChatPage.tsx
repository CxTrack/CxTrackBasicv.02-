import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, ArrowLeft, Send, Plus, ExternalLink, X, Search, Smile, Settings, Paperclip } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Message, Conversation, ChatSettings, DEFAULT_CHAT_SETTINGS } from '@/types/chat.types';
import { MOCK_USERS, MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/data/mockChatData';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { ChatSettingsModal } from '@/components/chat/ChatSettingsModal';
import { FileAttachmentButton, FilePreview } from '@/components/chat/FileAttachment';

interface ChatPageProps {
    isPopup?: boolean;
}

// Memoized message bubble for performance
const MessageBubble = React.memo<{
    msg: Message;
    isOwn: boolean;
    currentUserId: string;
    onAddReaction: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, reactionId: string) => void;
    compact: boolean;
}>(({ msg, isOwn, currentUserId, onAddReaction, onRemoveReaction, compact }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
        <div className={`
      max-w-[70%] ${compact ? 'px-3 py-2' : 'px-5 py-3'} rounded-2xl
      ${isOwn
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'}
    `}>
            <p className={`${compact ? 'text-sm' : 'text-[15px]'} leading-relaxed whitespace-pre-wrap`}>{msg.content}</p>
            <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {msg.reactions && msg.reactions.length > 0 && (
                <MessageReactions
                    messageId={msg.id}
                    reactions={msg.reactions}
                    currentUserId={currentUserId}
                    onAddReaction={onAddReaction}
                    onRemoveReaction={onRemoveReaction}
                    isOwnMessage={isOwn}
                />
            )}
        </div>
    </div>
));
MessageBubble.displayName = 'MessageBubble';

// Memoized conversation item
const ConversationItem = React.memo<{
    conv: Conversation;
    isActive: boolean;
    onClick: () => void;
}>(({ conv, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`
      w-full p-3 rounded-2xl mb-1
      flex items-center gap-3
      transition-all duration-200
      ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
    `}
    >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {conv.participants?.[0]?.user?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 text-left overflow-hidden">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
                {conv.name || conv.participants?.[0]?.user?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">Click to view message</p>
        </div>
    </button>
));
ConversationItem.displayName = 'ConversationItem';

export const ChatPage: React.FC<ChatPageProps> = ({ isPopup = false }) => {
    const { user } = useAuthContext();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
        const saved = localStorage.getItem('cxtrack_chat_settings');
        return saved ? JSON.parse(saved) : DEFAULT_CHAT_SETTINGS;
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchConversations();
    }, [user]);

    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation.id);
        }
    }, [activeConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const fetchConversations = async () => {
        if (!user) {
            setConversations(MOCK_CONVERSATIONS);
            return;
        }

        const { data, error } = await supabase
            .from('conversations')
            .select(`
        *,
        participants:conversation_participants(
          user:user_profiles(full_name)
        )
      `)
            .order('updated_at', { ascending: false });

        if ((!data || data.length === 0) && !error) {
            setConversations(MOCK_CONVERSATIONS);
        } else if (data) {
            setConversations(data);
        }
    };

    const loadMessages = async (conversationId: string) => {
        if (MOCK_MESSAGES[conversationId]) {
            setMessages(MOCK_MESSAGES[conversationId]);
            return;
        }

        const { data, error } = await supabase
            .from('messages')
            .select(`
        *,
        sender:user_profiles(full_name),
        reactions:message_reactions(id, emoji, user_id)
      `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if ((!data || data.length === 0) && !error && conversationId.startsWith('new-mock-')) {
            setMessages([]);
        } else if (data) {
            setMessages(data);
        }
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && !attachedFile) || !activeConversation) return;

        const messageContent = newMessage;
        setNewMessage('');
        setAttachedFile(null);

        const newMsg: Message = {
            id: `temp-${Date.now()}`,
            content: messageContent,
            sender_id: user?.id || 'user-me',
            created_at: new Date().toISOString(),
            sender: { full_name: 'Me' },
            reactions: [],
        };

        setMessages(prev => [...prev, newMsg]);

        // If it's a real conversation, try to save to DB
        if (!activeConversation.id.startsWith('conv-') && !activeConversation.id.startsWith('new-mock-') && user) {
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: activeConversation.id,
                    sender_id: user.id,
                    content: messageContent,
                });

            if (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleAddReaction = useCallback((messageId: string, emoji: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const newReaction = {
                    id: `reaction-${Date.now()}`,
                    message_id: messageId,
                    user_id: user?.id || 'user-me',
                    emoji,
                    created_at: new Date().toISOString(),
                };
                return {
                    ...msg,
                    reactions: [...(msg.reactions || []), newReaction],
                };
            }
            return msg;
        }));
    }, [user?.id]);

    const handleRemoveReaction = useCallback((messageId: string, reactionId: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    reactions: (msg.reactions || []).filter(r => r.id !== reactionId),
                };
            }
            return msg;
        }));
    }, []);

    const handleEmojiSelect = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    const handleStartNewConversation = (mockUser: typeof MOCK_USERS[0]) => {
        const newConv: Conversation = {
            id: `new-mock-${Date.now()}`,
            updated_at: new Date().toISOString(),
            participants: [{ user: { full_name: mockUser.full_name } }],
        };

        setConversations(prev => [newConv, ...prev]);
        setActiveConversation(newConv);
        setShowNewMessageModal(false);
        setMessages([]);
    };

    const handleSaveSettings = (settings: ChatSettings) => {
        setChatSettings(settings);
        localStorage.setItem('cxtrack_chat_settings', JSON.stringify(settings));
    };

    const handleOpenPopup = () => {
        window.open('/chat-window', 'CxTrackChat', 'width=450,height=700,menubar=no,toolbar=no,location=no,status=no');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && chatSettings.enter_to_send && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className={`
      h-full w-full 
      bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800
      flex flex-col
      ${!isPopup ? 'p-6' : ''}
    `}>
            <div className={`
        flex-1 
        bg-white/80 dark:bg-gray-800/80 
        backdrop-blur-xl
        ${!isPopup ? 'rounded-[32px] shadow-xl border border-white/20' : ''}
        overflow-hidden flex relative
      `}>

                {/* Left Side: Conversations List */}
                <div className={`
          w-full md:w-[350px] 
          border-r border-gray-200/50 dark:border-gray-700/50
          flex flex-col
          ${activeConversation ? 'hidden md:flex' : 'flex'}
        `}>
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"
                                title="Chat Settings"
                            >
                                <Settings size={18} />
                            </button>
                            {!isPopup && (
                                <button
                                    onClick={handleOpenPopup}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"
                                    title="Open in new window"
                                >
                                    <ExternalLink size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-4">
                        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl px-4 py-3 flex items-center">
                            <Search size={18} className="text-gray-400 mr-2" />
                            <input
                                className="bg-transparent w-full outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                                placeholder="Search conversations..."
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-2">
                        {conversations.map(conv => (
                            <ConversationItem
                                key={conv.id}
                                conv={conv}
                                isActive={activeConversation?.id === conv.id}
                                onClick={() => setActiveConversation(conv)}
                            />
                        ))}

                        {conversations.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No conversations yet</p>
                            </div>
                        )}
                    </div>

                    {/* New Msg Btn */}
                    <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button
                            onClick={() => setShowNewMessageModal(true)}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            New Message
                        </button>
                    </div>
                </div>

                {/* Right Side: Chat Area */}
                <div className={`
          flex-1 flex flex-col
          ${!activeConversation ? 'hidden md:flex bg-gray-50/50 dark:bg-gray-900/50 items-center justify-center' : 'flex'}
        `}>
                    {!activeConversation ? (
                        <div className="text-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-10 h-10 opacity-30" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Messages</h3>
                            <p>Select a conversation to start chatting</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActiveConversation(null)}
                                        className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                                        {activeConversation.name?.charAt(0) || activeConversation.participants?.[0]?.user?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {activeConversation.name || activeConversation.participants?.[0]?.user?.full_name || 'Chat'}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <span className="text-xs text-gray-500">Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className={`flex-1 overflow-y-auto p-6 ${chatSettings.compact_mode ? 'space-y-2' : 'space-y-4'}`}>
                                {messages.map((msg) => {
                                    const isOwn = msg.sender_id === (user?.id || 'user-me');
                                    return (
                                        <MessageBubble
                                            key={msg.id}
                                            msg={msg}
                                            isOwn={isOwn}
                                            currentUserId={user?.id || 'user-me'}
                                            onAddReaction={handleAddReaction}
                                            onRemoveReaction={handleRemoveReaction}
                                            compact={chatSettings.compact_mode}
                                        />
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Attached File Preview */}
                            {attachedFile && (
                                <div className="px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                    <FilePreview file={attachedFile} onRemove={() => setAttachedFile(null)} />
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-2">
                                    {/* Emoji Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            title="Add emoji"
                                        >
                                            <Smile size={20} />
                                        </button>
                                        {showEmojiPicker && (
                                            <EmojiPicker
                                                onSelect={handleEmojiSelect}
                                                onClose={() => setShowEmojiPicker(false)}
                                            />
                                        )}
                                    </div>

                                    {/* File Attachment */}
                                    <FileAttachmentButton
                                        onFileSelect={setAttachedFile}
                                        disabled={!!attachedFile}
                                    />

                                    {/* Input */}
                                    <input
                                        ref={inputRef}
                                        className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />

                                    {/* Send Button */}
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() && !attachedFile}
                                        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-full transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* New Message Modal */}
                {showNewMessageModal && (
                    <div className="absolute inset-0 z-50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">New Message</h3>
                                <button
                                    onClick={() => setShowNewMessageModal(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-500 mb-3 uppercase font-bold tracking-wider">Suggested Contacts</p>
                                <div className="space-y-2">
                                    {MOCK_USERS.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleStartNewConversation(u)}
                                            className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl flex items-center gap-3 transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {u.full_name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">{u.full_name}</p>
                                                <p className="text-xs text-gray-500">{u.status}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            <ChatSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={chatSettings}
                onSave={handleSaveSettings}
            />
        </div>
    );
};
