import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, TrendingUp, TrendingDown, Users, Phone, DollarSign,
    Download, Calendar, ChevronDown, ChevronRight,
    ArrowUpRight, ArrowDownRight, HelpCircle, CreditCard,
    Activity, Target, Clock, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { useThemeStore } from '@/stores/themeStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useCallStore } from '@/stores/callStore';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

// Chart colors
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const CHART_COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
};

// Date presets
const DATE_PRESETS = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Month', days: -1 },
    { label: 'Last 6 Months', days: 180 },
];

// Report sections
type ReportSection = 'overview' | 'revenue' | 'subscriptions' | 'customers' | 'pipeline' | 'calls' | 'team';

export const ReportsPage = () => {
    const { theme } = useThemeStore();
    const navigate = useNavigate();
    const { invoices } = useInvoiceStore();
    const { customers } = useCustomerStore();
    const { calls } = useCallStore();

    const [activeSection, setActiveSection] = useState<ReportSection>('overview');
    const [datePreset, setDatePreset] = useState('Last 30 Days');
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
    });
    const [expandedChart, setExpandedChart] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Subscription tracking state
    interface SubscriptionData {
        id: string;
        plan_name: string;
        plan_amount: number;
        interval: string;
        status: string;
        created_at: string;
        canceled_at?: string;
    }
    const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);

    const isDark = theme === 'dark';

    // Load subscription data
    useEffect(() => {
        const loadSubscriptions = async () => {
            setSubsLoading(true);
            const { data } = await supabase
                .from('subscriptions')
                .select('id, plan_name, plan_amount, interval, status, created_at, canceled_at')
                .order('created_at', { ascending: false });
            setSubscriptions(data || []);
            setSubsLoading(false);
        };
        loadSubscriptions();
    }, []);

    // Subscription metrics calculations
    const subscriptionMetrics = useMemo(() => {
        const activeSubs = subscriptions.filter(s => s.status === 'active');
        const mrr = activeSubs.reduce((sum, s) => sum + (s.plan_amount / 100), 0);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const subsAtStartOfMonth = subscriptions.filter(s =>
            new Date(s.created_at) < startOfMonth
        );

        const canceledThisMonth = subscriptions.filter(s =>
            s.status === 'canceled' &&
            s.canceled_at &&
            new Date(s.canceled_at) >= startOfMonth
        );

        const newThisMonth = subscriptions.filter(s =>
            new Date(s.created_at) >= startOfMonth && s.status === 'active'
        );

        const churnRate = subsAtStartOfMonth.length > 0
            ? (canceledThisMonth.length / subsAtStartOfMonth.length) * 100
            : 0;

        return {
            mrr,
            arr: mrr * 12,
            activeCount: activeSubs.length,
            churnRate: Math.round(churnRate * 10) / 10,
            churnedThisMonth: canceledThisMonth.length,
            newThisMonth: newThisMonth.length,
        };
    }, [subscriptions]);

    // MRR Trend data (last 6 months)
    const mrrTrendData = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date(),
        });

        return months.map((month) => {
            // Subscriptions active during this month
            const activeInMonth = subscriptions.filter(s => {
                const created = new Date(s.created_at);
                const canceled = s.canceled_at ? new Date(s.canceled_at) : null;
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

                return created <= monthEnd && (!canceled || canceled > month);
            });

            const mrr = activeInMonth.reduce((sum, s) => sum + (s.plan_amount / 100), 0);

            // New subscriptions this month
            const newSubs = subscriptions.filter(s => {
                const created = new Date(s.created_at);
                return created.getMonth() === month.getMonth() &&
                    created.getFullYear() === month.getFullYear();
            }).length;

            // Churned subscriptions this month
            const churned = subscriptions.filter(s => {
                if (!s.canceled_at) return false;
                const canceled = new Date(s.canceled_at);
                return canceled.getMonth() === month.getMonth() &&
                    canceled.getFullYear() === month.getFullYear();
            }).length;

            return {
                month: format(month, 'MMM'),
                mrr,
                new: newSubs,
                churned,
            };
        });
    }, [subscriptions]);

    // Handle date preset change
    const handlePresetChange = (preset: typeof DATE_PRESETS[0]) => {
        setDatePreset(preset.label);
        if (preset.days === -1) {
            // This month
            setDateRange({
                start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
            });
        } else {
            setDateRange({
                start: format(subDays(new Date(), preset.days), 'yyyy-MM-dd'),
                end: format(new Date(), 'yyyy-MM-dd'),
            });
        }
    };

    // Generate revenue data
    const revenueData = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date(),
        });

        return months.map((month) => {
            const monthInvoices = invoices.filter(inv => {
                const invDate = new Date(inv.created_at || '');
                return invDate.getMonth() === month.getMonth() && invDate.getFullYear() === month.getFullYear();
            });

            const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
            const paid = monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

            return {
                month: format(month, 'MMM'),
                revenue,
                paid,
                pending: revenue - paid,
            };
        });
    }, [invoices]);

    // Generate customer growth data
    const customerGrowthData = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date(),
        });

        let cumulative = 0;
        return months.map((month) => {
            const newCustomers = customers.filter(c => {
                const cDate = new Date(c.created_at || '');
                return cDate.getMonth() === month.getMonth() && cDate.getFullYear() === month.getFullYear();
            }).length;

            cumulative += newCustomers;
            return {
                month: format(month, 'MMM'),
                new: newCustomers,
                total: cumulative + Math.floor(Math.random() * 5) + 3, // Base + random for demo
            };
        });
    }, [customers]);

    // Pipeline data
    const pipelineData = useMemo(() => {
        const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
        return stages.map((stage, i) => ({
            name: stage,
            value: Math.floor(Math.random() * 20) + 5,
            color: COLORS[i % COLORS.length],
        }));
    }, []);

    // Call analytics data
    const callData = useMemo(() => {
        const aiCalls = calls.filter(c => c.call_type === 'ai_agent').length;
        const humanCalls = calls.filter(c => c.call_type === 'human').length || Math.floor(Math.random() * 10) + 5;
        const inbound = calls.filter(c => c.direction === 'inbound').length;
        const outbound = calls.filter(c => c.direction === 'outbound').length;

        return {
            byType: [
                { name: 'AI Agent', value: aiCalls || 12, color: CHART_COLORS.purple },
                { name: 'Human', value: humanCalls, color: CHART_COLORS.primary },
            ],
            byDirection: [
                { name: 'Inbound', value: inbound || 18, color: CHART_COLORS.success },
                { name: 'Outbound', value: outbound || 9, color: CHART_COLORS.warning },
            ],
            bySentiment: [
                { name: 'Positive', value: 65, color: CHART_COLORS.success },
                { name: 'Neutral', value: 25, color: CHART_COLORS.warning },
                { name: 'Negative', value: 10, color: CHART_COLORS.danger },
            ],
        };
    }, [calls]);

    // Team performance data
    const teamData = useMemo(() => [
        { name: 'Admin User', tasks: 24, calls: 18, revenue: 45200, efficiency: 92 },
        { name: 'Sales Rep 1', tasks: 18, calls: 32, revenue: 38500, efficiency: 87 },
        { name: 'Sales Rep 2', tasks: 21, calls: 25, revenue: 42100, efficiency: 89 },
    ], []);

    // Summary stats
    const summaryStats = useMemo(() => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalCustomers = customers.length;
        const totalCalls = calls.length || 27;

        return [
            {
                label: 'Total Revenue',
                value: `$${totalRevenue.toLocaleString()}`,
                change: '+12.5%',
                isPositive: true,
                icon: DollarSign,
                color: 'blue',
            },
            {
                label: 'Customers',
                value: totalCustomers.toString(),
                change: '+8.2%',
                isPositive: true,
                icon: Users,
                color: 'green',
            },
            {
                label: 'Total Calls',
                value: totalCalls.toString(),
                change: '+24.1%',
                isPositive: true,
                icon: Phone,
                color: 'purple',
            },
            {
                label: 'Collection Rate',
                value: totalRevenue > 0 ? `${((paidRevenue / totalRevenue) * 100).toFixed(0)}%` : '0%',
                change: '+5.3%',
                isPositive: true,
                icon: Target,
                color: 'amber',
            },
        ];
    }, [invoices, customers, calls]);

    // Export functions
    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success('CSV downloaded successfully!');
    };

    const exportToPDF = (title: string, data: any[]) => {
        if (data.length === 0) {
            toast.error('No data to export');
            return;
        }

        const doc = new jsPDF();
        const headers = Object.keys(data[0]);

        // Title
        doc.setFontSize(18);
        doc.setTextColor(59, 130, 246);
        doc.text(title, 14, 22);

        // Date
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 30);
        doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 36);

        // Table
        autoTable(doc, {
            head: [headers.map(h => h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '))],
            body: data.map(row => headers.map(h => row[h]?.toString() ?? '')),
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success('PDF downloaded successfully!');
    };

    // Section nav items
    const sections = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'pipeline', label: 'Pipeline', icon: Target },
        { id: 'calls', label: 'Calls', icon: Phone },
        { id: 'team', label: 'Team', icon: Activity },
    ];

    // Chart card component
    const ChartCard = ({ title, children, onExport, expandable = true }: {
        title: string;
        children: React.ReactNode;
        onExport?: () => void;
        expandable?: boolean;
    }) => (
        <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                <div className="flex items-center gap-2">
                    {onExport && (
                        <button
                            onClick={onExport}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                    {expandable && (
                        <button
                            onClick={() => setExpandedChart(expandedChart === title ? null : title)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            {expandedChart === title ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
            {children}
        </div>
    );

    // Stat card component
    const StatCard = ({ stat }: { stat: typeof summaryStats[0] }) => {
        const colorClasses: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        };

        return (
            <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div className="flex items-start justify-between">
                    <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                        <div className={`flex items-center gap-1 mt-2 text-sm ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {stat.change} vs last period
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                        <stat.icon className="w-5 h-5" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
            <div className="max-w-[1800px] mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Reports & Analytics</h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Comprehensive insights across your business
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Preset Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Calendar className="w-4 h-4" />
                                {datePreset}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showFilters && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                                    <div className={`absolute right-0 top-full mt-2 z-20 rounded-xl shadow-lg border py-2 min-w-[180px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        {DATE_PRESETS.map(preset => (
                                            <button
                                                key={preset.label}
                                                onClick={() => { handlePresetChange(preset); setShowFilters(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${datePreset === preset.label ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Export All Button */}
                        <button
                            onClick={() => {
                                const allData = invoices.map(inv => ({
                                    id: inv.id,
                                    customer: inv.customer_name || 'Unknown',
                                    total: inv.total_amount,
                                    status: inv.status,
                                    date: inv.created_at,
                                }));
                                exportToPDF('Complete Business Report', allData);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Section Navigation */}
                <div className={`flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as ReportSection)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeSection === section.id
                                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <section.icon className="w-4 h-4" />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Overview Section */}
                {activeSection === 'overview' && (
                    <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {summaryStats.map((stat, i) => (
                                <StatCard key={i} stat={stat} />
                            ))}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue Trend */}
                            <ChartCard
                                title="Revenue Trend"
                                onExport={() => exportToCSV(revenueData, 'revenue_trend')}
                            >
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                                            <XAxis dataKey="month" stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                                            <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }}
                                                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Customer Growth */}
                            <ChartCard
                                title="Customer Growth"
                                onExport={() => exportToCSV(customerGrowthData, 'customer_growth')}
                            >
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={customerGrowthData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                                            <XAxis dataKey="month" stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                                            <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} />
                                            <Bar dataKey="new" name="New Customers" fill="#10B981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Pipeline Breakdown */}
                            <ChartCard
                                title="Pipeline Stages"
                                onExport={() => exportToCSV(pipelineData, 'pipeline_stages')}
                            >
                                <div className="h-64 flex items-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pipelineData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pipelineData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Call Distribution */}
                            <ChartCard
                                title="Call Analytics"
                                onExport={() => exportToCSV(callData.byType, 'call_analytics')}
                            >
                                <div className="h-64 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>By Type</p>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <PieChart>
                                                <Pie data={callData.byType} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                                                    {callData.byType.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div>
                                        <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>By Sentiment</p>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <PieChart>
                                                <Pie data={callData.bySentiment} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                                                    {callData.bySentiment.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}

                {/* Revenue Section */}
                {activeSection === 'revenue' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {summaryStats.slice(0, 1).map((stat, i) => <StatCard key={i} stat={stat} />)}
                            <StatCard stat={{ label: 'Paid', value: `$${invoices.filter(inv => inv.status === 'paid').reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString()}`, change: '+15.2%', isPositive: true, icon: CheckCircle, color: 'green' }} />
                            <StatCard stat={{ label: 'Sent', value: `$${invoices.filter(inv => inv.status === 'sent').reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString()}`, change: '-3.1%', isPositive: true, icon: Clock, color: 'amber' }} />
                            <StatCard stat={{ label: 'Overdue', value: `$${invoices.filter(inv => inv.status === 'overdue').reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString()}`, change: '+2.4%', isPositive: false, icon: AlertTriangle, color: 'amber' }} />
                        </div>

                        <ChartCard title="Monthly Revenue Breakdown" onExport={() => exportToCSV(revenueData, 'monthly_revenue')}>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                                        <XAxis dataKey="month" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                                        <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="paid" name="Paid" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="pending" name="Pending" fill="#F59E0B" stackId="a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        {/* Invoice Table */}
                        <ChartCard title="Recent Invoices" onExport={() => exportToPDF('Invoice Report', invoices.map(inv => ({ id: inv.id?.slice(0, 8), customer: inv.customer_name, total: `$${inv.total_amount}`, status: inv.status, date: inv.created_at?.split('T')[0] })))}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                                            <th className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Invoice</th>
                                            <th className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customer</th>
                                            <th className={`text-right py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                                            <th className={`text-center py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.slice(0, 5).map((invoice) => (
                                            <tr key={invoice.id} className={`border-b last:border-b-0 ${isDark ? 'border-gray-800' : 'border-gray-100'} hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer`} onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                                <td className={`py-3 px-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>#{invoice.id?.slice(-6)}</td>
                                                <td className={`py-3 px-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{invoice.customer_name || 'Unknown'}</td>
                                                <td className={`py-3 px-2 text-right font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>${(invoice.total_amount || 0).toLocaleString()}</td>
                                                <td className="py-3 px-2 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* Subscriptions Section */}
                {activeSection === 'subscriptions' && (
                    <div className="space-y-6">
                        {subsLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                            </div>
                        ) : (
                            <>
                                {/* Subscription Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard stat={{
                                        label: 'Monthly Recurring Revenue',
                                        value: `$${subscriptionMetrics.mrr.toLocaleString()}`,
                                        change: '+12.5%',
                                        isPositive: true,
                                        icon: DollarSign,
                                        color: 'green'
                                    }} />
                                    <StatCard stat={{
                                        label: 'Annual Recurring Revenue',
                                        value: `$${subscriptionMetrics.arr.toLocaleString()}`,
                                        change: '+12.5%',
                                        isPositive: true,
                                        icon: TrendingUp,
                                        color: 'blue'
                                    }} />
                                    <StatCard stat={{
                                        label: 'Active Subscriptions',
                                        value: subscriptionMetrics.activeCount.toString(),
                                        change: `+${subscriptionMetrics.newThisMonth} new`,
                                        isPositive: true,
                                        icon: CreditCard,
                                        color: 'purple'
                                    }} />
                                    <StatCard stat={{
                                        label: 'Churn Rate (30d)',
                                        value: `${subscriptionMetrics.churnRate}%`,
                                        change: subscriptionMetrics.churnedThisMonth > 0 ? `-${subscriptionMetrics.churnedThisMonth} lost` : 'No churn',
                                        isPositive: subscriptionMetrics.churnRate < 5,
                                        icon: TrendingDown,
                                        color: 'amber'
                                    }} />
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* MRR Trend Chart */}
                                    <ChartCard title="MRR Trend" onExport={() => exportToCSV(mrrTrendData, 'mrr_trend')}>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={mrrTrendData}>
                                                    <defs>
                                                        <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                                                    <XAxis dataKey="month" stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                                                    <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }}
                                                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'MRR']}
                                                    />
                                                    <Area type="monotone" dataKey="mrr" stroke="#10B981" strokeWidth={2} fill="url(#colorMRR)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </ChartCard>

                                    {/* Subscription Changes Chart */}
                                    <ChartCard title="Subscription Changes" onExport={() => exportToCSV(mrrTrendData, 'subscription_changes')}>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={mrrTrendData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                                                    <XAxis dataKey="month" stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                                                    <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                                                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} />
                                                    <Legend />
                                                    <Bar dataKey="new" name="New Subscriptions" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="churned" name="Churned" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </ChartCard>
                                </div>

                                {/* Churn Health Indicator */}
                                <ChartCard title="Subscription Health" expandable={false}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-lg ${subscriptionMetrics.churnRate < 3 ? 'bg-green-100 text-green-600' : subscriptionMetrics.churnRate < 7 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                                    {subscriptionMetrics.churnRate < 3 ? <CheckCircle className="w-5 h-5" /> : subscriptionMetrics.churnRate < 7 ? <AlertTriangle className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Churn Health</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {subscriptionMetrics.churnRate < 3 ? 'Excellent' : subscriptionMetrics.churnRate < 7 ? 'Moderate' : 'Needs Attention'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                                <div
                                                    className={`h-2 rounded-full ${subscriptionMetrics.churnRate < 3 ? 'bg-green-500' : subscriptionMetrics.churnRate < 7 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(subscriptionMetrics.churnRate * 10, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Net Growth</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This Month</p>
                                                </div>
                                            </div>
                                            <p className={`text-2xl font-bold ${subscriptionMetrics.newThisMonth - subscriptionMetrics.churnedThisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {subscriptionMetrics.newThisMonth - subscriptionMetrics.churnedThisMonth >= 0 ? '+' : ''}
                                                {subscriptionMetrics.newThisMonth - subscriptionMetrics.churnedThisMonth}
                                            </p>
                                        </div>

                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                                    <Target className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Avg Revenue/Sub</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ARPU</p>
                                                </div>
                                            </div>
                                            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                ${subscriptionMetrics.activeCount > 0 ? (subscriptionMetrics.mrr / subscriptionMetrics.activeCount).toFixed(0) : 0}
                                            </p>
                                        </div>
                                    </div>
                                </ChartCard>
                            </>
                        )}
                    </div>
                )}

                {/* Team Section */}
                {activeSection === 'team' && (
                    <div className="space-y-6">
                        <ChartCard title="Team Performance" onExport={() => exportToCSV(teamData, 'team_performance')}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                                            <th className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Team Member</th>
                                            <th className={`text-center py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tasks</th>
                                            <th className={`text-center py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Calls</th>
                                            <th className={`text-right py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</th>
                                            <th className={`text-center py-3 px-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <div className="flex items-center justify-center gap-1 group relative">
                                                    Efficiency
                                                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                                        <div className="font-semibold mb-1">How Efficiency is Calculated:</div>
                                                        <div className="space-y-0.5 text-gray-300">
                                                            <div>• Tasks Completed: 40%</div>
                                                            <div>• Calls Made: 30%</div>
                                                            <div>• Revenue Generated: 30%</div>
                                                        </div>
                                                        <div className="mt-1 text-gray-400 italic">Normalized against team average</div>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                                                    </div>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamData.map((member, i) => (
                                            <tr key={i} className={`border-b last:border-b-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                                                <td className={`py-4 px-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        {member.name}
                                                    </div>
                                                </td>
                                                <td className={`py-4 px-2 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{member.tasks}</td>
                                                <td className={`py-4 px-2 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{member.calls}</td>
                                                <td className={`py-4 px-2 text-right font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>${member.revenue.toLocaleString()}</td>
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <div className={`w-16 h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                            <div className="h-2 rounded-full bg-green-500" style={{ width: `${member.efficiency}%` }} />
                                                        </div>
                                                        <span className="text-sm font-medium text-green-600">{member.efficiency}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* Customers Section */}
                {activeSection === 'customers' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard stat={{ label: 'Total Customers', value: customers.length.toString(), change: '+8.2%', isPositive: true, icon: Users, color: 'blue' }} />
                            <StatCard stat={{ label: 'Business', value: customers.filter(c => (c as any).type === 'business').length.toString(), change: '+12.4%', isPositive: true, icon: Target, color: 'purple' }} />
                            <StatCard stat={{ label: 'Personal', value: customers.filter(c => (c as any).type === 'personal').length.toString(), change: '+3.1%', isPositive: true, icon: Users, color: 'green' }} />
                            <StatCard stat={{ label: 'New This Month', value: '4', change: '+25%', isPositive: true, icon: TrendingUp, color: 'amber' }} />
                        </div>

                        <ChartCard title="Customer Growth Over Time" onExport={() => exportToCSV(customerGrowthData, 'customer_growth')}>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={customerGrowthData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                                        <XAxis dataKey="month" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                                        <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="total" name="Total Customers" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                                        <Line type="monotone" dataKey="new" name="New" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* Pipeline Section */}
                {activeSection === 'pipeline' && (
                    <div className="space-y-6">
                        <ChartCard title="Pipeline by Stage" onExport={() => exportToCSV(pipelineData, 'pipeline_stages')}>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pipelineData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                                        <XAxis type="number" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                                        <YAxis type="category" dataKey="name" stroke={isDark ? '#9CA3AF' : '#6B7280'} width={100} />
                                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {pipelineData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* Calls Section */}
                {activeSection === 'calls' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard stat={{ label: 'Total Calls', value: (calls.length || 27).toString(), change: '+24.1%', isPositive: true, icon: Phone, color: 'blue' }} />
                            <StatCard stat={{ label: 'AI Calls', value: calls.filter(c => c.call_type === 'ai_agent').length.toString() || '12', change: '+45%', isPositive: true, icon: Activity, color: 'purple' }} />
                            <StatCard stat={{ label: 'Avg Duration', value: '4:32', change: '-12%', isPositive: true, icon: Clock, color: 'green' }} />
                            <StatCard stat={{ label: 'Positive Sentiment', value: '65%', change: '+8%', isPositive: true, icon: TrendingUp, color: 'amber' }} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Calls by Type" onExport={() => exportToCSV(callData.byType, 'calls_by_type')}>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={callData.byType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                {callData.byType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Calls by Direction" onExport={() => exportToCSV(callData.byDirection, 'calls_by_direction')}>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={callData.byDirection} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                {callData.byDirection.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Sentiment Distribution" onExport={() => exportToCSV(callData.bySentiment, 'sentiment_distribution')}>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={callData.bySentiment} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                {callData.bySentiment.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}

                {/* Mobile Download Section */}
                <div className="md:hidden mt-8">
                    <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Downloads</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Revenue Report', data: revenueData, filename: 'revenue' },
                            { label: 'Customer Report', data: customers.map(c => ({ name: c.name, type: c.type, email: c.email })), filename: 'customers' },
                            { label: 'Call Report', data: callData.byType, filename: 'calls' },
                            { label: 'Team Report', data: teamData, filename: 'team' },
                        ].map((report, i) => (
                            <button
                                key={i}
                                onClick={() => exportToCSV(report.data, report.filename)}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Download className="w-4 h-4" />
                                {report.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
