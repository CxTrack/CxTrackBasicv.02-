import React, { useState } from 'react';
import { X, Search, Clock, Smile, Heart, ThumbsUp, Star } from 'lucide-react';
import { EMOJI_CATEGORIES, QUICK_REACTIONS } from '@/types/chat.types';

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'Smileys': <Smile size={16} />,
    'Gestures': <ThumbsUp size={16} />,
    'Hearts': <Heart size={16} />,
    'Objects': <Star size={16} />,
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('Smileys');
    const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
        const saved = localStorage.getItem('cxtrack_recent_emojis');
        return saved ? JSON.parse(saved) : QUICK_REACTIONS;
    });

    const handleEmojiClick = (emoji: string) => {
        onSelect(emoji);

        // Update recent emojis
        const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 12);
        setRecentEmojis(updated);
        localStorage.setItem('cxtrack_recent_emojis', JSON.stringify(updated));
    };

    const filteredEmojis = searchQuery
        ? Object.values(EMOJI_CATEGORIES).flat().filter(emoji =>
            emoji.includes(searchQuery)
        )
        : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || [];

    return (
        <div className="absolute bottom-full mb-2 left-0 w-[320px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Emoji</h4>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <X size={16} className="text-gray-500" />
                </button>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-2">
                    <Search size={14} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search emoji..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
                <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <button
                        onClick={() => setActiveCategory('Recent')}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeCategory === 'Recent'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                            }`}
                        title="Recent"
                    >
                        <Clock size={16} />
                    </button>
                    {Object.keys(EMOJI_CATEGORIES).map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeCategory === category
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                                }`}
                            title={category}
                        >
                            {CATEGORY_ICONS[category]}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji Grid */}
            <div className="p-2 h-[200px] overflow-y-auto">
                {!searchQuery && activeCategory === 'Recent' && (
                    <>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">Recent</p>
                        <div className="grid grid-cols-8 gap-1">
                            {recentEmojis.map((emoji, index) => (
                                <button
                                    key={`recent-${index}`}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {(searchQuery || activeCategory !== 'Recent') && (
                    <>
                        {!searchQuery && (
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
                                {activeCategory}
                            </p>
                        )}
                        <div className="grid grid-cols-8 gap-1">
                            {filteredEmojis.map((emoji, index) => (
                                <button
                                    key={`${activeCategory}-${index}`}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hover:scale-110"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        {filteredEmojis.length === 0 && searchQuery && (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">No emoji found</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EmojiPicker;
