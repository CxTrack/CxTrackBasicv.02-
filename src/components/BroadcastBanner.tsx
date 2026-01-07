import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface Broadcast {
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    is_dismissible: boolean;
    expires_at?: string;
    created_at: string;
}

export const BroadcastBanner = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

    useEffect(() => {
        fetchBroadcasts();

        // Optional: Realtime subscription
        // const subscription = supabase
        //   .channel('broadcasts')
        //   .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, fetchBroadcasts)
        //   .subscribe();

        // return () => {
        //   subscription.unsubscribe();
        // };
    }, []);

    const fetchBroadcasts = async () => {
        const { data, error } = await supabase
            .from('broadcasts')
            .select('*')
            .gt('expires_at', new Date().toISOString()) // Only active
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Filter out dismissed broadcasts
            const dismissedIds = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
            const activeBroadcasts = data.filter((b: Broadcast) => !dismissedIds.includes(b.id));
            setBroadcasts(activeBroadcasts);
        }
    };

    const dismissBroadcast = (id: string) => {
        const dismissedIds = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
        localStorage.setItem('dismissed_broadcasts', JSON.stringify([...dismissedIds, id]));
        setBroadcasts(prev => prev.filter(b => b.id !== id));
    };

    if (broadcasts.length === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
            <div className="max-w-2xl mx-auto mt-6 space-y-3 px-6 pointer-events-auto">
                {broadcasts.map(broadcast => {
                    const config = {
                        low: {
                            gradient: 'from-blue-500/90 to-blue-600/90',
                            icon: Info,
                            iconBg: 'bg-blue-400/30',
                        },
                        normal: {
                            gradient: 'from-gray-600/90 to-gray-700/90',
                            icon: Info,
                            iconBg: 'bg-gray-500/30',
                        },
                        high: {
                            gradient: 'from-orange-500/90 to-orange-600/90',
                            icon: AlertTriangle,
                            iconBg: 'bg-orange-400/30',
                        },
                        urgent: {
                            gradient: 'from-red-500/90 to-red-600/90',
                            icon: AlertCircle,
                            iconBg: 'bg-red-400/30',
                        },
                    }[broadcast.priority] || { // Default fallback
                        gradient: 'from-gray-600/90 to-gray-700/90',
                        icon: Info,
                        iconBg: 'bg-gray-500/30',
                    };

                    const Icon = config.icon;

                    return (
                        <div
                            key={broadcast.id}
                            className={`
                bg-gradient-to-r ${config.gradient}
                backdrop-blur-2xl
                rounded-[24px]
                p-5 pr-4
                shadow-2xl
                border border-white/10
                flex items-start gap-4
                animate-slide-down
                transform transition-all duration-500 ease-out
              `}
                            style={{
                                animationDelay: `${broadcasts.indexOf(broadcast) * 100}ms`,
                            }}
                        >
                            {/* Icon */}
                            <div className={`
                w-10 h-10 ${config.iconBg}
                rounded-full
                flex items-center justify-center
                flex-shrink-0
              `}>
                                <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <h4 className="text-white font-semibold text-[15px] mb-1 tracking-tight">
                                    {broadcast.title}
                                </h4>
                                <p className="text-white/90 text-[13px] leading-relaxed">
                                    {broadcast.message}
                                </p>
                            </div>

                            {/* Dismiss Button */}
                            {broadcast.is_dismissible && (
                                <button
                                    onClick={() => dismissBroadcast(broadcast.id)}
                                    className="
                    w-7 h-7 
                    hover:bg-white/20
                    rounded-full
                    flex items-center justify-center
                    transition-all duration-200
                    flex-shrink-0
                  "
                                >
                                    <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Export legacy name for backwards compatibility
export const AppleBroadcastBanner = BroadcastBanner;
