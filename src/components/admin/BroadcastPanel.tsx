import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Send, Clock, Eye, X,
    Copy, Archive, RefreshCw, FileText, Plus,
    Calendar, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Broadcast {
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    type: string;
    status: 'active' | 'expired' | 'scheduled';
    created_at: string;
    expires_at: string;
    views: number;
    dismissals: number;
}

const MOCK_HISTORY: Broadcast[] = [
    { id: '1', title: 'Scheduled Maintenance', message: 'System will be down for updates', priority: 'high', type: 'site_wide', status: 'active', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), views: 1243, dismissals: 89 },
    { id: '2', title: 'New Feature Release', message: 'Check out our new AI-powered copilot', priority: 'normal', type: 'site_wide', status: 'active', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), views: 856, dismissals: 234 },
    { id: '3', title: 'Holiday Hours', message: 'Office closed Dec 25-26', priority: 'low', type: 'site_wide', status: 'expired', created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), views: 2431, dismissals: 1892 },
    { id: '4', title: 'Security Update', message: 'Please update your password', priority: 'urgent', type: 'site_wide', status: 'expired', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), views: 3521, dismissals: 3100 },
];

const TEMPLATES = [
    { id: 't1', name: 'Maintenance Notice', title: 'Scheduled Maintenance', message: 'We will be performing scheduled maintenance on [DATE] from [TIME] to [TIME]. During this period, the service may be temporarily unavailable.', priority: 'high' as const },
    { id: 't2', name: 'New Feature', title: 'New Feature Available', message: "We're excited to announce [FEATURE NAME]! Check it out in your dashboard.", priority: 'normal' as const },
    { id: 't3', name: 'Security Alert', title: 'Important Security Notice', message: 'For your security, please [ACTION]. If you have any questions, contact support.', priority: 'urgent' as const },
    { id: 't4', name: 'Holiday Notice', title: 'Holiday Schedule', message: 'Our offices will be closed on [DATE]. We will resume normal operations on [DATE].', priority: 'low' as const },
];

export const BroadcastPanel = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [broadcastType, setBroadcastType] = useState('site_wide');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
    const [expiresIn, setExpiresIn] = useState(24);
    const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [, setShowScheduleModal] = useState(false);
    const [broadcasts,] = useState<Broadcast[]>(MOCK_HISTORY);

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
                    type: broadcastType,
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

    const applyTemplate = (template: typeof TEMPLATES[0]) => {
        setTitle(template.title);
        setMessage(template.message);
        setPriority(template.priority);
        setActiveTab('compose');
        toast.success(`Template "${template.name}" applied`);
    };

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const filteredBroadcasts = broadcasts.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const priorityColors = {
        low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
        normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
                {[
                    { id: 'compose', label: 'Compose', icon: Plus },
                    { id: 'history', label: 'History', icon: Clock },
                    { id: 'templates', label: 'Templates', icon: FileText },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-5 gap-4">
                {/* Left Panel - Compose/Templates */}
                <div className="col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    {activeTab === 'compose' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Send className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Quick Broadcast</h3>
                                    <p className="text-xs text-gray-500">Send to all users</p>
                                </div>
                            </div>

                            {/* Title */}
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Broadcast title..."
                                className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm 
                  text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
                            />

                            {/* Message */}
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Your message..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm 
                  text-gray-900 dark:text-white placeholder-gray-500 outline-none resize-none focus:ring-2 focus:ring-blue-500/50"
                            />

                            {/* Compact Options Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Audience */}
                                <select
                                    value={broadcastType}
                                    onChange={(e) => setBroadcastType(e.target.value)}
                                    className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-lg
                    text-gray-700 dark:text-gray-300 border-0"
                                >
                                    <option value="site_wide">Everyone</option>
                                    <option value="organization">Organization</option>
                                    <option value="user_specific">Specific User</option>
                                </select>

                                {/* Priority */}
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                                    className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-lg
                    text-gray-700 dark:text-gray-300 border-0"
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>

                                {/* Expiry */}
                                <select
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                    className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-lg
                    text-gray-700 dark:text-gray-300 border-0"
                                >
                                    <option value="1">1 hour</option>
                                    <option value="6">6 hours</option>
                                    <option value="24">24 hours</option>
                                    <option value="72">3 days</option>
                                    <option value="168">1 week</option>
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={sendBroadcast}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 
                    text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Now
                                </button>
                                <button
                                    onClick={() => setShowScheduleModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 
                    text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg 
                    hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Schedule
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Quick Templates</h3>
                            {TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg 
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${priorityColors[template.priority]}`}>
                                            {template.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{template.message}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Panel - History */}
                <div className="col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search broadcasts..."
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 
                    border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg
                  text-gray-700 dark:text-gray-300 border-0"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                                <option value="scheduled">Scheduled</option>
                            </select>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                        {filteredBroadcasts.map(broadcast => (
                            <div key={broadcast.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${broadcast.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{broadcast.title}</h4>
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${priorityColors[broadcast.priority]}`}>
                                                {broadcast.priority}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{broadcast.message}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span>{getTimeAgo(broadcast.created_at)}</span>
                                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{broadcast.views.toLocaleString()}</span>
                                            <span className="flex items-center gap-1"><X className="w-3 h-3" />{broadcast.dismissals}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Duplicate">
                                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Resend">
                                            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Archive">
                                            <Archive className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredBroadcasts.length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-400">
                                <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No broadcasts found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export legacy name for backwards compatibility
export const AppleBroadcastPanel = BroadcastPanel;
