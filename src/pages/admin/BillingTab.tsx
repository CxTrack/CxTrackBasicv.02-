import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, CreditCard, FileText } from 'lucide-react';

export const BillingTab = () => {
    const [stats, setStats] = useState({
        mrr: 0,
        arr: 0,
        activeSubscriptions: 0,
        churnRate: 0,
    });
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        loadBillingData();
    }, []);

    const loadBillingData = async () => {
        // Load subscriptions
        const { data: subs } = await supabase
            .from('subscriptions')
            .select(`
        *,
        organizations (name, status)
      `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        setSubscriptions(subs || []);

        // Calculate MRR
        const mrr = (subs || []).reduce((sum: number, sub: any) => sum + (sub.plan_amount / 100), 0);
        setStats(prev => ({ ...prev, mrr, arr: mrr * 12, activeSubscriptions: subs?.length || 0 }));

        // Load recent invoices
        const { data: invs } = await supabase
            .from('stripe_invoices')
            .select(`
        *,
        organizations (name)
      `)
            .order('created_at', { ascending: false })
            .limit(50);

        setInvoices(invs || []);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Revenue</h2>

            {/* Revenue Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Recurring Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.mrr.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Annual Recurring Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.arr.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeSubscriptions}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Churn Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.churnRate}%</p>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Subscriptions</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Plan</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Next Billing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {subscriptions.map(sub => (
                            <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {sub.organizations?.name}
                                </td>
                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300 capitalize">
                                    {sub.plan_name}
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                    ${(sub.plan_amount / 100).toFixed(2)}/{sub.interval}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(sub.current_period_end).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Invoices Table */}
            {invoices.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Invoices</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Invoice ID</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        {inv.stripe_invoice_id}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {inv.organizations?.name}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                        ${(inv.amount_paid / 100).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(inv.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
