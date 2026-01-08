import { useState } from 'react';
import {
    Users, CreditCard, BarChart2, MessageSquare,
    Settings, Shield, Database, LayoutDashboard,
    LogOut, ArrowLeft, Send, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UsersTab } from './UsersTab';
import { BillingTab } from './BillingTab';
import { AnalyticsTab } from './AnalyticsTab';
import { SupportTab } from './SupportTab';
import { SettingsTab } from './SettingsTab';
import { AuditLogsTab } from './AuditLogsTab';
import { DatabaseTab } from './DatabaseTab';
import { PlansTab } from './PlansTab';
import { BroadcastPanel } from '../../components/admin/BroadcastPanel';
// import { useThemeStore } from '@/stores/themeStore'; // Assuming this exists based on Dashboard.tsx

export const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('users');
    // const { theme } = useThemeStore();

    const tabs = [
        { id: 'users', label: 'Users', icon: Users, component: UsersTab },
        { id: 'billing', label: 'Billing & Revenue', icon: CreditCard, component: BillingTab },
        { id: 'plans', label: 'Subscription Plans', icon: DollarSign, component: PlansTab },
        { id: 'analytics', label: 'Analytics', icon: BarChart2, component: AnalyticsTab },
        { id: 'support', label: 'Support Tickets', icon: MessageSquare, component: SupportTab },
        { id: 'settings', label: 'Settings', icon: Settings, component: SettingsTab },
        { id: 'audit', label: 'Audit Logs', icon: Shield, component: AuditLogsTab },
        { id: 'database', label: 'Database', icon: Database, component: DatabaseTab },
        { id: 'broadcasts', label: 'Broadcasts', icon: Send, component: BroadcastPanel },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || UsersTab;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg text-white">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                            Admin
                        </h1>
                        <p className="text-xs text-gray-500 font-medium tracking-wide">PANEL</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <div className="mb-4">
                        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Back to CRM
                        </Link>
                    </div>

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
                        Management
                    </p>

                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors">
                        <LogOut className="w-5 h-5" />
                        Logout
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-gray-400" />
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-right">
                                <p className="font-medium text-gray-900 dark:text-white">Admin User</p>
                                <p className="text-xs text-gray-500">Super Admin</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 border-2 border-white dark:border-gray-800 shadow-sm"></div>
                        </div>
                    </div>
                </header>

                <div className="p-8 w-full">
                    <div className="animate-fade-in-up">
                        <ActiveComponent />
                    </div>
                </div>
            </main>
        </div>
    );
};
