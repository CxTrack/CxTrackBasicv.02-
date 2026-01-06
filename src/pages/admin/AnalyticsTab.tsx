import { Users, Activity, Database, Zap, Info } from 'lucide-react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HealthScoreCell } from '@/components/HealthScoreCell';

export const AnalyticsTab = () => {

    const userGrowthData = [
        { month: 'Jan', users: 1200 },
        { month: 'Feb', users: 1350 },
        { month: 'Mar', users: 1500 },
        { month: 'Apr', users: 1800 },
        { month: 'May', users: 2100 },
        { month: 'Jun', users: 2543 },
    ];

    const revenueData = [
        { month: 'Jan', revenue: 45000 },
        { month: 'Feb', revenue: 48000 },
        { month: 'Mar', revenue: 52000 },
        { month: 'Apr', revenue: 58000 },
        { month: 'May', revenue: 62000 },
        { month: 'Jun', revenue: 68420 },
    ];

    const orgMetrics = [
        {
            id: '1',
            name: 'Acme Corp',
            active_users: 45,
            total_users: 50,
            api_calls_30d: 125000,
            storage_gb: 45.2,
            calls_made: 120,
            revenue: 2500,
            subscription_status: 'active',
            open_tickets: 1,
            features_used: ['invoices', 'quotes', 'calls', 'pipeline', 'tasks'],
            last_login_days_ago: 0,
            payment_failures: 0,
            error_rate: 0.3,
        },
        {
            id: '2',
            name: 'Globex Inc',
            active_users: 120,
            total_users: 150,
            api_calls_30d: 450000,
            storage_gb: 128.5,
            calls_made: 850,
            revenue: 5500,
            subscription_status: 'active',
            open_tickets: 2,
            features_used: ['invoices', 'quotes', 'calls', 'pipeline'],
            last_login_days_ago: 1,
            payment_failures: 0,
            error_rate: 0.5,
        },
        {
            id: '3',
            name: 'Soylent Corp',
            active_users: 8,
            total_users: 12,
            api_calls_30d: 5000,
            storage_gb: 5.2,
            calls_made: 20,
            revenue: 450,
            subscription_status: 'past_due',
            open_tickets: 6,
            features_used: ['invoices'],
            last_login_days_ago: 15,
            payment_failures: 2,
            error_rate: 3.2,
        },
        {
            id: '4',
            name: 'Initech',
            active_users: 85,
            total_users: 100,
            api_calls_30d: 210000,
            storage_gb: 65.8,
            calls_made: 340,
            revenue: 3500,
            subscription_status: 'active',
            open_tickets: 0,
            features_used: ['invoices', 'quotes', 'calls', 'tasks'],
            last_login_days_ago: 0,
            payment_failures: 0,
            error_rate: 0.2,
        },
        {
            id: '5',
            name: 'Umbrella Corp',
            active_users: 200,
            total_users: 250,
            api_calls_30d: 890000,
            storage_gb: 450.2,
            calls_made: 1200,
            revenue: 12000,
            subscription_status: 'active',
            open_tickets: 3,
            features_used: ['invoices', 'quotes', 'calls'],
            last_login_days_ago: 2,
            payment_failures: 1,
            error_rate: 1.1,
        }
    ];

    return (
        <div className="space-y-6">

            {/* Top Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-green-600 text-sm font-semibold">↑ 12%</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">2,543</p>
                    <p className="text-xs text-gray-500 mt-2">+289 this month</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-green-600 text-sm font-semibold">↑ 8%</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">API Requests / min</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">45.2k</p>
                    <p className="text-xs text-gray-500 mt-2">Peak: 78k/min</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-red-600 text-sm font-semibold">↓ 2%</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">System Uptime</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">99.9%</p>
                    <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                            <Database className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-green-600 text-sm font-semibold">↑ 5%</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Storage Used</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">234 GB</p>
                    <p className="text-xs text-gray-500 mt-2">Of 1 TB total</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">

                {/* User Growth Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Growth</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Revenue</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Stats Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Organization Metrics</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Active Users</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">API Calls (30d)</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Storage</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Calls Made</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Revenue</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                    <div className="flex items-center gap-2">
                                        Account Health
                                        <Info className="w-4 h-4 text-gray-400" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {orgMetrics.map(org => (
                                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{org.name}</td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{org.active_users}/{org.total_users}</td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{org.api_calls_30d.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{org.storage_gb} GB</td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{org.calls_made}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">${org.revenue}</td>
                                    <td className="px-6 py-4">
                                        <HealthScoreCell organization={org} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Top Features Used</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Invoices</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">8,432</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Quotes</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">5,231</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">AI Calls</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">3,891</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Response Times</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">API p50</span>
                            <span className="text-sm font-bold text-green-600">45ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">API p95</span>
                            <span className="text-sm font-bold text-yellow-600">120ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">API p99</span>
                            <span className="text-sm font-bold text-orange-600">280ms</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Error Rates</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">4xx Errors</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">0.12%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">5xx Errors</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">0.03%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Success Rate</span>
                            <span className="text-sm font-bold text-green-600">99.85%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
