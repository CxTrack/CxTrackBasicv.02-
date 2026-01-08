import { useState, useEffect } from 'react';
import {
    Search, Plus, Clock, User, Tag, MessageSquare, X, Send,
    AlertTriangle, CheckCircle, Circle, ArrowRight, MoreVertical,
    Trash2, Edit2, ExternalLink, ChevronDown, Filter, LayoutGrid, List,
    RefreshCw
} from 'lucide-react';
import { useTicketStore, Ticket, TicketStatus, TicketPriority, TicketCategory, TicketMessage } from '@/stores/ticketStore';
import toast from 'react-hot-toast';

export const SupportTab = () => {
    const {
        tickets,
        messages,
        loading,
        filters,
        fetchTickets,
        createTicket,
        updateTicket,
        deleteTicket,
        updateStatus,
        assignTicket,
        fetchMessages,
        addMessage,
        setFilter,
        resetFilters,
        getFilteredTickets,
        getStats,
    } = useTicketStore();

    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [actionMenu, setActionMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const stats = getStats();
    const filteredTickets = getFilteredTickets();

    const getPriorityColor = (priority: TicketPriority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        }
    };

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'in_progress': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const handleTicketClick = async (ticket: Ticket) => {
        setSelectedTicket(ticket);
        await fetchMessages(ticket.id);
    };

    const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
        try {
            await updateStatus(ticketId, newStatus);
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket({ ...selectedTicket, status: newStatus });
            }
            toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteTicket = async (ticketId: string) => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await deleteTicket(ticketId);
            setSelectedTicket(null);
            setActionMenu(null);
            toast.success('Ticket deleted');
        } catch {
            toast.error('Failed to delete ticket');
        }
    };

    if (loading && tickets.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Open</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.open}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Urgent</span>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.urgent}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response</span>
                        <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgResponseTime}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={filters.search}
                        onChange={(e) => setFilter('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                    />
                </div>
                <select
                    value={filters.status}
                    onChange={(e) => setFilter('status', e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select
                    value={filters.priority}
                    onChange={(e) => setFilter('priority', e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <select
                    value={filters.category}
                    onChange={(e) => setFilter('category', e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Categories</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug">Bug</option>
                    <option value="general">General</option>
                </select>
                <div className="flex items-center gap-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    New Ticket
                </button>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
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
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Assigned</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Created</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        No tickets found. {filters.search || filters.status !== 'all' ? 'Try adjusting your filters.' : ''}
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                        onClick={() => handleTicketClick(ticket)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                                #{ticket.id.slice(-8)}
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
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{ticket.category.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {ticket.assigned_to_name ? (
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
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === ticket.id ? null : ticket.id); }}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>
                                            {actionMenu === ticket.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                                    <div className="absolute right-6 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[150px]">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleTicketClick(ticket); setActionMenu(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            View Details
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Kanban Board View */}
            {viewMode === 'board' && (
                <KanbanBoard
                    tickets={filteredTickets}
                    onTicketClick={handleTicketClick}
                    onStatusChange={handleStatusChange}
                />
            )}

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={async (data) => {
                        await createTicket(data);
                        setShowCreateModal(false);
                        toast.success('Ticket created successfully');
                    }}
                />
            )}

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    messages={messages[selectedTicket.id] || []}
                    onClose={() => setSelectedTicket(null)}
                    onStatusChange={(status) => handleStatusChange(selectedTicket.id, status)}
                    onAddMessage={async (msg, isInternal) => {
                        await addMessage(selectedTicket.id, msg, isInternal);
                    }}
                    onUpdate={async (data) => {
                        const updated = await updateTicket(selectedTicket.id, data);
                        setSelectedTicket(updated);
                    }}
                />
            )}
        </div>
    );
};

// Kanban Board Component
const KanbanBoard = ({
    tickets,
    onTicketClick,
    onStatusChange,
}: {
    tickets: Ticket[];
    onTicketClick: (ticket: Ticket) => void;
    onStatusChange: (ticketId: string, status: TicketStatus) => void;
}) => {
    const columns: { status: TicketStatus; label: string; color: string }[] = [
        { status: 'open', label: 'Open', color: 'border-blue-500' },
        { status: 'in_progress', label: 'In Progress', color: 'border-purple-500' },
        { status: 'resolved', label: 'Resolved', color: 'border-green-500' },
        { status: 'closed', label: 'Closed', color: 'border-gray-400' },
    ];

    const handleDragStart = (e: React.DragEvent, ticketId: string) => {
        e.dataTransfer.setData('ticketId', ticketId);
    };

    const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('ticketId');
        onStatusChange(ticketId, status);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="grid grid-cols-4 gap-4">
            {columns.map((column) => (
                <div
                    key={column.status}
                    className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border-t-4 ${column.color}`}
                    onDrop={(e) => handleDrop(e, column.status)}
                    onDragOver={handleDragOver}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{column.label}</h3>
                        <span className="text-sm text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                            {tickets.filter(t => t.status === column.status).length}
                        </span>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                        {tickets
                            .filter(t => t.status === column.status)
                            .map(ticket => (
                                <div
                                    key={ticket.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                                    onClick={() => onTicketClick(ticket)}
                                    className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
                                >
                                    <p className="font-medium text-sm text-gray-900 dark:text-white mb-2">{ticket.title}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{ticket.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                        {ticket.assigned_to_name && (
                                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {ticket.assigned_to_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Create Ticket Modal
const CreateTicketModal = ({
    onClose,
    onCreate,
}: {
    onClose: () => void;
    onCreate: (data: Partial<Ticket>) => Promise<void>;
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium' as TicketPriority,
        category: 'general' as TicketCategory,
        customer_name: '',
        customer_email: '',
        organization_name: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            toast.error('Title and description are required');
            return;
        }
        setSubmitting(true);
        try {
            await onCreate(formData);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Ticket</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                            placeholder="Brief description of the issue"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
                            placeholder="Detailed description of the issue..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                            >
                                <option value="general">General</option>
                                <option value="billing">Billing</option>
                                <option value="technical">Technical</option>
                                <option value="feature_request">Feature Request</option>
                                <option value="bug">Bug</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                            <input
                                type="text"
                                value={formData.customer_name}
                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                placeholder="Customer name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Email</label>
                            <input
                                type="email"
                                value={formData.customer_email}
                                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                placeholder="customer@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization</label>
                        <input
                            type="text"
                            value={formData.organization_name}
                            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                            placeholder="Customer's organization"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Ticket Detail Modal
const TicketDetailModal = ({
    ticket,
    messages,
    onClose,
    onStatusChange,
    onAddMessage,
    onUpdate,
}: {
    ticket: Ticket;
    messages: TicketMessage[];
    onClose: () => void;
    onStatusChange: (status: TicketStatus) => void;
    onAddMessage: (message: string, isInternal: boolean) => Promise<void>;
    onUpdate: (data: Partial<Ticket>) => Promise<void>;
}) => {
    const [newMessage, setNewMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [sending, setSending] = useState(false);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        setSending(true);
        try {
            await onAddMessage(newMessage, isInternal);
            setNewMessage('');
            toast.success('Message added');
        } catch {
            toast.error('Failed to add message');
        } finally {
            setSending(false);
        }
    };

    const statusOptions: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl my-4">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-gray-500">#{ticket.id}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                }`}>
                                {ticket.priority}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                    {/* Main Content */}
                    <div className="col-span-2 p-6">
                        {/* Description */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        {/* Labels */}
                        {ticket.labels && ticket.labels.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Labels</h3>
                                <div className="flex flex-wrap gap-2">
                                    {ticket.labels.map((label, i) => (
                                        <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs">
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Comments ({messages.length})
                            </h3>
                            <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`p-4 rounded-xl ${msg.is_internal ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {msg.user_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{msg.user_name}</p>
                                                <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                                            </div>
                                            {msg.is_internal && (
                                                <span className="ml-auto px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Internal</span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">{msg.message}</p>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
                                )}
                            </div>

                            {/* Add Comment */}
                            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Add a comment..."
                                    rows={3}
                                    className="w-full bg-transparent resize-none outline-none dark:text-white"
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <input
                                            type="checkbox"
                                            checked={isInternal}
                                            onChange={(e) => setIsInternal(e.target.checked)}
                                            className="rounded"
                                        />
                                        Internal note
                                    </label>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || sending}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                                    >
                                        <Send className="w-4 h-4" />
                                        {sending ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="p-6 space-y-6">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                            <select
                                value={ticket.status}
                                onChange={(e) => onStatusChange(e.target.value as TicketStatus)}
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white text-sm"
                            >
                                {statusOptions.map((s) => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                            <select
                                value={ticket.priority}
                                onChange={(e) => onUpdate({ priority: e.target.value as TicketPriority })}
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white text-sm"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigned To</label>
                            {ticket.assigned_to_name ? (
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {ticket.assigned_to_name.charAt(0)}
                                    </div>
                                    <span className="text-sm text-gray-900 dark:text-white">{ticket.assigned_to_name}</span>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Unassigned</p>
                            )}
                        </div>

                        {/* Customer */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Customer</label>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.customer_name}</p>
                                {ticket.customer_email && <p className="text-xs text-gray-500">{ticket.customer_email}</p>}
                                {ticket.organization_name && <p className="text-xs text-gray-500">{ticket.organization_name}</p>}
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{ticket.category.replace('_', ' ')}</span>
                            </div>
                        </div>

                        {/* Dates */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Created</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(ticket.created_at).toLocaleString()}</p>
                        </div>
                        {ticket.resolved_at && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resolved</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(ticket.resolved_at).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
