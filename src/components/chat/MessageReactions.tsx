import React, { useState } from 'react';
import { QUICK_REACTIONS } from '@/types/chat.types';

interface MessageReactionsProps {
    messageId: string;
    reactions: { emoji: string; user_id: string; id: string }[];
    currentUserId: string;
    onAddReaction: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, reactionId: string) => void;
    isOwnMessage: boolean;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
    messageId,
    reactions,
    currentUserId,
    onAddReaction,
    onRemoveReaction,
    isOwnMessage,
}) => {
    const [showPicker, setShowPicker] = useState(false);

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return acc;
    }, {} as Record<string, typeof reactions>);

    const handleReactionClick = (emoji: string) => {
        const existingReaction = reactions.find(r => r.emoji === emoji && r.user_id === currentUserId);
        if (existingReaction) {
            onRemoveReaction(messageId, existingReaction.id);
        } else {
            onAddReaction(messageId, emoji);
        }
        setShowPicker(false);
    };

    return (
        <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {/* Existing Reactions */}
            {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
                const hasUserReacted = reactionList.some(r => r.user_id === currentUserId);
                return (
                    <button
                        key={emoji}
                        onClick={() => handleReactionClick(emoji)}
                        className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
              transition-all duration-200
              ${hasUserReacted
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
            `}
                    >
                        <span className="text-sm">{emoji}</span>
                        <span className="font-medium">{reactionList.length}</span>
                    </button>
                );
            })}

            {/* Add Reaction Button */}
            <div className="relative">
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs opacity-0 group-hover:opacity-100"
                >
                    +
                </button>

                {/* Quick Reaction Picker */}
                {showPicker && (
                    <div className={`absolute bottom-full mb-1 ${isOwnMessage ? 'right-0' : 'left-0'} bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-1 flex items-center gap-0.5 z-10`}>
                        {QUICK_REACTIONS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleReactionClick(emoji)}
                                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all hover:scale-125"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageReactions;
