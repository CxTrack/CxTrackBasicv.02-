import { useState } from 'react';
import {
    Shield, LayoutDashboard, Building2, Users, DollarSign,
    BarChart3, Activity, Headphones, Settings, FileText, Database,
    X, TrendingUp, CheckCircle, UserPlus, Send, Download, RefreshCw,
    Plus, Eye, Edit, MoreVertical
} from 'lucide-react';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
    const [activeAdminTab, setActiveAdminTab] = useState('overview');

    if (!isOpen) return null;

    const adminTabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'organizations', label: 'Organizations', icon: Building2, badge: '142' },
        { id: 'users', label: 'Users', icon: Users, badge: '1,249' },
        { id: 'billing', label: 'Billing & Revenue', icon: DollarSign },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'monitoring', label: 'System Health', icon: Activity },
        { id: 'support', label: 'Support Tickets', icon: Headphones, badge: '23' },
        { id: 'settings', label: 'Admin Settings', icon: Settings },
        { id: 'logs', label: 'Audit Logs', icon: FileText },
        { id: 'database', label: 'Database', icon: Database },
    ];

    const renderAdminTabContent = () => {
        switch (activeAdminTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-white" />
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Organizations</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">142</p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12 this month</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">1,249</p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+89 this month</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Revenue</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">$68,420</p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+18% vs last month</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-white" />
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">System Health</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">99.9%</p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">All systems operational</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <button className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 transition-colors text-center group">
                                    <UserPlus className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Add Organization</p>
                                </button>
                                <button className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition-colors text-center group">
                                    <Send className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Send Announcement</p>
                                </button>
                                <button className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 transition-colors text-center group">
                                    <Download className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Export Data</p>
                                </button>
                                <button className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 transition-colors text-center group">
                                    <RefreshCw className="w-8 h-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">System Refresh</p>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Sign-ups</h3>
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                A{i}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">Acme Corp {i}</p>
                                                <p className="text-xs text-gray-500">Professional Plan • {i * 2} hours ago</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Support Tickets</h3>
                                <div className="space-y-3">
                                    {[
                                        { title: 'Calendar sync issue', status: 'urgent', time: '5 min ago' },
                                        { title: 'Billing question', status: 'high', time: '1 hour ago' },
                                        { title: 'Feature request', status: 'medium', time: '3 hours ago' },
                                        { title: 'Login problem', status: 'urgent', time: '5 hours ago' },
                                        { title: 'Export not working', status: 'low', time: '1 day ago' },
                                    ].map((ticket, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                            <div className={`w-2 h-2 rounded-full ${ticket.status === 'urgent' ? 'bg-red-500' :
                                                ticket.status === 'high' ? 'bg-orange-500' :
                                                    ticket.status === 'medium' ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                }`} />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">{ticket.title}</p>
                                                <p className="text-xs text-gray-500">{ticket.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'organizations':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h2>
                                <p className="text-gray-600 dark:text-gray-400">Manage all CxTrack customers</p>
                            </div>
                            <button className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Organization
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Search organizations..."
                                className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <select className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                <option>All Plans</option>
                                <option>Free</option>
                                <option>Professional</option>
                                <option>Enterprise</option>
                            </select>
                            <select className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Trial</option>
                                <option>Cancelled</option>
                            </select>
                        </div>

                        {/* Organizations Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Plan</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Users</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Revenue</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                                            A{i}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">Acme Corp {i}</p>
                                                            <p className="text-xs text-gray-500">acme{i}@example.com</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
                                                        Professional
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">{5 + i}</td>
                                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">${49 * (5 + i)}/mo</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'monitoring':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Health Monitoring</h2>

                        {/* Status Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="font-semibold text-gray-900 dark:text-white">API Status</p>
                                </div>
                                <p className="text-3xl font-bold text-green-600">Operational</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Response time: 45ms</p>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Database</p>
                                </div>
                                <p className="text-3xl font-bold text-green-600">Healthy</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Query time: 12ms</p>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Uptime</p>
                                </div>
                                <p className="text-3xl font-bold text-green-600">99.98%</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Last 30 days</p>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">23%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div className="bg-green-600 h-3 rounded-full" style={{ width: '23%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">67%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div className="bg-yellow-600 h-3 rounded-full" style={{ width: '67%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">45%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div className="bg-blue-600 h-3 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <Database className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-bold">Module Under Construction</h3>
                        <p>This admin module is currently being developed.</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl w-full max-w-[1600px] h-[90vh] overflow-hidden border-2 border-slate-200 dark:border-slate-800 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Shield className="w-7 h-7 text-white stroke-[2.5px]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                CxTrack Admin Panel
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Enterprise System Management • v1.0.4
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                        <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Navigation */}
                    <div className="w-72 border-r-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 overflow-y-auto">
                        <nav className="space-y-2">
                            {adminTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveAdminTab(tab.id)}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                    ${activeAdminTab === tab.id
                                            ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/30 active:scale-95'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                                        }
                  `}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeAdminTab === tab.id ? 'stroke-[3px]' : ''}`} />
                                    {tab.label}
                                    {tab.badge && (
                                        <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${activeAdminTab === tab.id ? 'bg-white text-purple-600' : 'bg-red-500 text-white'}`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 dark:bg-slate-900/10">
                        {renderAdminTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}
