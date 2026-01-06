import { useState } from 'react';
import { Search, Plus, Clock, User, Tag, MessageSquare } from 'lucide-react';

export const SupportTab = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [statusFilter, setStatusFilter] = useState('all');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [priorityFilter, setPriorityFilter] = useState('all');

    const tickets = [
        {
            id: 'TKT-00123456',
            title: 'Billing issue with Enterprise plan',
            description: 'Customer was charged twice for the monthly subscription',
            customer_name: 'Sarah Connor',
            organization_name: 'Cyberdyne Systems',
            priority: 'high',
            status: 'open',
            category: 'Billing',
            assigned_to: 'user_123',
            assigned_to_name: 'John Doe',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            message_count: 3
        },
        {
            id: 'TKT-00123457',
            title: 'API rate limit exceeded unexpectedly',
            description: 'Rate limits are triggering despite being under the limit',
            customer_name: 'Neo Anderson',
            organization_name: 'Matrix Corp',
            priority: 'medium',
            status: 'in_progress',
            category: 'Technical',
            assigned_to: 'user_124',
            assigned_to_name: 'Jane Smith',
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            message_count: 5
        },
        {
            id: 'TKT-00123458',
            title: 'Feature request: Dark mode export',
            description: 'User wants to export PDF in dark mode',
            customer_name: 'Mike Ross',
            organization_name: 'Pearson Specter',
            priority: 'low',
            status: 'resolved',
            category: 'Feature Request',
            assigned_to: null,
            assigned_to_name: '',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            message_count: 1
        },
        {
            id: 'TKT-00123459',
            title: 'Login failures on mobile',
            description: 'iOS app crashing on login screen',
            customer_name: 'Bruce Wayne',
            organization_name: 'Wayne Enterprises',
            priority: 'urgent',
            status: 'open',
            category: 'Bug',
            assigned_to: 'user_125',
            assigned_to_name: 'Alfred P.',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            message_count: 0
        }
    ];

    return (
        <div className="space-y-6">

            {/* Header with Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Open</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Urgent</span>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response</span>
                        <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">2.4h</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <button className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Ticket
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ID</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Title</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Customer</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Priority</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Category</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Assigned To</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Created</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Messages</th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                        #{ticket.id.slice(4, 12)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{ticket.title}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{ticket.description}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.customer_name}</p>
                                            <p className="text-xs text-gray-500">{ticket.organization_name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            ticket.status === 'in_progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                ticket.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-3 h-3 text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.category}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {ticket.assigned_to ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {ticket.assigned_to_name.charAt(0)}
                                            </div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.assigned_to_name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                    <br />
                                    <span className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.message_count}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
