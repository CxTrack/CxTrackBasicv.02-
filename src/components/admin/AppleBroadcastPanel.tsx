import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Globe, Building2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const AppleBroadcastPanel = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [broadcastType, setBroadcastType] = useState('site_wide');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
    const [expiresIn, setExpiresIn] = useState(24);

    const sendBroadcast = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Please enter a title and message');
            return;
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresIn);

        try {
            const { error } = await supabase
                .from('broadcasts')
                .insert({
                    title,
                    message,
                    priority,
                    type: broadcastType, // Assuming this column exists
                    expires_at: expiresAt.toISOString(),
                    is_dismissible: true,
                    created_at: new Date().toISOString(),
                });

            if (error) throw error;

            toast.success('Broadcast sent successfully');
            setTitle('');
            setMessage('');
            setPriority('normal');
            setBroadcastType('site_wide');
        } catch (error) {
            console.error('Error sending broadcast:', error);
            toast.error('Failed to send broadcast');
        }
    };

    return (
        <div className="
      bg-white/60 dark:bg-gray-900/60
      backdrop-blur-2xl
      rounded-[32px]
      border border-gray-200/50 dark:border-gray-700/50
      overflow-hidden
      shadow-xl
    ">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-4 mb-2">
                    <div className="
            w-12 h-12 
            bg-gradient-to-br from-purple-500 to-pink-600
            rounded-[16px]
            flex items-center justify-center
            shadow-lg shadow-purple-500/30
          ">
                        <Send className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                            Send Broadcast
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            System-wide announcement
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="p-8 space-y-6">

                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Scheduled Maintenance"
                        className="
              w-full px-5 py-4
              bg-gray-100/60 dark:bg-gray-800/60
              hover:bg-gray-100 dark:hover:bg-gray-800
              border-0
              rounded-[16px]
              text-[15px] text-gray-900 dark:text-white
              placeholder-gray-500
              outline-none
              transition-all duration-200
              focus:ring-2 focus:ring-blue-500/50
            "
                    />
                </div>

                {/* Message Textarea */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="We'll be performing scheduled maintenance..."
                        rows={4}
                        className="
              w-full px-5 py-4
              bg-gray-100/60 dark:bg-gray-800/60
              hover:bg-gray-100 dark:hover:bg-gray-800
              border-0
              rounded-[16px]
              text-[15px] text-gray-900 dark:text-white
              placeholder-gray-500
              outline-none
              resize-none
              transition-all duration-200
              focus:ring-2 focus:ring-blue-500/50
            "
                    />
                </div>

                {/* Broadcast Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Audience
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'site_wide', label: 'Everyone', icon: Globe },
                            { id: 'organization', label: 'Organization', icon: Building2 },
                            { id: 'user_specific', label: 'Specific User', icon: UserIcon },
                        ].map((type) => {
                            const Icon = type.icon;
                            const isActive = broadcastType === type.id;

                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setBroadcastType(type.id)}
                                    className={`
                    px-4 py-5
                    rounded-[16px]
                    transition-all duration-200
                    flex flex-col items-center gap-3
                    ${isActive
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-gray-100/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }
                  `}
                                >
                                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                                    <span className="text-sm font-medium">{type.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Priority Slider */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Priority
                    </label>
                    <div className="flex gap-2">
                        {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPriority(p)}
                                className={`
                  flex-1 py-3
                  rounded-[12px]
                  text-sm font-medium
                  transition-all duration-200
                  ${priority === p
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-gray-100/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }
                `}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Expires In */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Expires in {expiresIn} hours
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="168"
                        value={expiresIn}
                        onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                        className="
              w-full h-2 
              bg-gray-200 dark:bg-gray-700 
              rounded-full 
              appearance-none 
              cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-blue-500
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:shadow-blue-500/50
            "
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>1 hour</span>
                        <span>1 week</span>
                    </div>
                </div>

                {/* Send Button */}
                <button
                    onClick={sendBroadcast}
                    className="
            w-full py-4
            bg-gradient-to-r from-blue-500 to-purple-600
            hover:from-blue-600 hover:to-purple-700
            text-white font-semibold
            rounded-[16px]
            transition-all duration-200
            hover:shadow-lg hover:shadow-blue-500/50
            flex items-center justify-center gap-3
          "
                >
                    <Send className="w-5 h-5" strokeWidth={2.5} />
                    Send Broadcast
                </button>
            </div>
        </div>
    );
};
