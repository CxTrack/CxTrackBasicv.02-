import { useState } from 'react';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { HealthScoreCell } from '@/components/HealthScoreCell';
import { FilterBar, CompactMetric, CompactMetricBar } from '@/components/shared/FilterBar';
import { ReportGenerator, ExportButton } from '@/components/reports/ReportGenerator';

export const AnalyticsTab = () => {
    const [dateRange, setDateRange] = useState('30d');
    const [orgFilter, setOrgFilter] = useState('all');
    const [showReportModal, setShowReportModal] = useState(false);

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
        { id: '1', name: 'Acme Corp', active_users: 45, total_users: 50, api_calls_30d: 125000, storage_gb: 45.2, calls_made: 120, revenue: 2500, subscription_status: 'active', open_tickets: 1, features_used: ['invoices', 'quotes', 'calls', 'pipeline', 'tasks'], last_login_days_ago: 0, payment_failures: 0, error_rate: 0.3, trend: 12 },
        { id: '2', name: 'Globex Inc', active_users: 120, total_users: 150, api_calls_30d: 450000, storage_gb: 128.5, calls_made: 850, revenue: 5500, subscription_status: 'active', open_tickets: 2, features_used: ['invoices', 'quotes', 'calls', 'pipeline'], last_login_days_ago: 1, payment_failures: 0, error_rate: 0.5, trend: 8 },
        { id: '3', name: 'Soylent Corp', active_users: 8, total_users: 12, api_calls_30d: 5000, storage_gb: 5.2, calls_made: 20, revenue: 450, subscription_status: 'past_due', open_tickets: 6, features_used: ['invoices'], last_login_days_ago: 15, payment_failures: 2, error_rate: 3.2, trend: -15 },
        { id: '4', name: 'Initech', active_users: 85, total_users: 100, api_calls_30d: 210000, storage_gb: 65.8, calls_made: 340, revenue: 3500, subscription_status: 'active', open_tickets: 0, features_used: ['invoices', 'quotes', 'calls', 'tasks'], last_login_days_ago: 0, payment_failures: 0, error_rate: 0.2, trend: 5 },
        { id: '5', name: 'Umbrella Corp', active_users: 200, total_users: 250, api_calls_30d: 890000, storage_gb: 450.2, calls_made: 1200, revenue: 12000, subscription_status: 'active', open_tickets: 3, features_used: ['invoices', 'quotes', 'calls'], last_login_days_ago: 2, payment_failures: 1, error_rate: 1.1, trend: 22 },
    ];

    const orgOptions = orgMetrics.map(org => ({ value: org.id, label: org.name }));

    const handleExport = (format: string) => {
        console.log(`Exporting analytics as ${format}`);
    };

    return (
        <div className="space-y-4">
            {/* Compact Header with Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <FilterBar
                    dateRange={{ value: dateRange, onChange: setDateRange }}
                    filters={[
                        { id: 'org', label: 'Organization', options: orgOptions, value: orgFilter, onChange: setOrgFilter },
                    ]}
                    onClearAll={() => { setDateRange('30d'); setOrgFilter('all'); }}
                >
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white 
              bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Generate Report
                    </button>
                </FilterBar>

                {/* Compact Metrics Row */}
                <CompactMetricBar className="mt-3">
                    <CompactMetric label="Users" value="2,543" change={{ value: 12, isPositive: true }} />
                    <CompactMetric label="API/min" value="45.2k" change={{ value: 8, isPositive: true }} />
                    <CompactMetric label="Uptime" value="99.9%" change={{ value: 2, isPositive: false }} />
                    <CompactMetric label="Storage" value="234 GB" change={{ value: 5, isPositive: true }} />
                    <CompactMetric label="Revenue" value="$68.4k" change={{ value: 15, isPositive: true }} />
                </CompactMetricBar>
            </div>

            {/* Charts Row - Reduced Height */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">User Growth</h3>
                        <ExportButton onExport={handleExport} size="sm" />
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={userGrowthData}>
                            <defs>
                                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} width={40} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12 }} />
                            <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fill="url(#userGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Monthly Revenue</h3>
                        <ExportButton onExport={handleExport} size="sm" />
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} width={50} tickFormatter={(v) => `$${v / 1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Organization Table - Compact */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Organization Metrics</h3>
                    <ExportButton onExport={handleExport} size="sm" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Users</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">API Calls</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Storage</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Revenue</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Trend</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Health</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {orgMetrics.map(org => (
                                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-sm text-gray-900 dark:text-white">{org.name}</td>
                                    <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">{org.active_users}/{org.total_users}</td>
                                    <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">{(org.api_calls_30d / 1000).toFixed(0)}k</td>
                                    <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">{org.storage_gb} GB</td>
                                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white">${org.revenue}</td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${org.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {org.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(org.trend)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5"><HealthScoreCell organization={org} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Stats - 3 Column Compact */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Top Features</h4>
                    <div className="space-y-2">
                        {[{ name: 'Invoices', value: '8,432' }, { name: 'Quotes', value: '5,231' }, { name: 'AI Calls', value: '3,891' }].map(f => (
                            <div key={f.name} className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-gray-400">{f.name}</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{f.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Response Times</h4>
                    <div className="space-y-2">
                        {[{ name: 'p50', value: '45ms', color: 'text-green-600' }, { name: 'p95', value: '120ms', color: 'text-yellow-600' }, { name: 'p99', value: '280ms', color: 'text-orange-600' }].map(r => (
                            <div key={r.name} className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-gray-400">API {r.name}</span>
                                <span className={`text-xs font-bold ${r.color}`}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Error Rates</h4>
                    <div className="space-y-2">
                        {[{ name: '4xx Errors', value: '0.12%' }, { name: '5xx Errors', value: '0.03%' }, { name: 'Success', value: '99.85%', color: 'text-green-600' }].map(e => (
                            <div key={e.name} className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-gray-400">{e.name}</span>
                                <span className={`text-xs font-bold ${e.color || 'text-gray-900 dark:text-white'}`}>{e.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Report Generator Modal */}
            <ReportGenerator
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                defaultType="revenue"
            />
        </div>
    );
};
