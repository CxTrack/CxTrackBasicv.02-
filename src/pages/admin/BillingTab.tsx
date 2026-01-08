import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    DollarSign, TrendingUp, TrendingDown, CreditCard, FileText,
    ExternalLink, MoreVertical, XCircle, RefreshCw, Eye,
    AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Subscription {
    id: string;
    organization_id: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    plan_name: string;
    plan_amount: number;
    interval: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    created_at: string;
    canceled_at?: string;
    organizations?: { name: string; status: string };
}

interface StripeInvoice {
    id: string;
    organization_id: string;
    stripe_invoice_id: string;
    amount_paid: number;
    amount_due: number;
    currency: string;
    status: string;
    invoice_pdf?: string;
    hosted_invoice_url?: string;
    created_at: string;
    organizations?: { name: string };
}

export const BillingTab = () => {
    const [stats, setStats] = useState({
        mrr: 0,
        arr: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        churnedThisMonth: 0,
        newThisMonth: 0,
    });
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBillingData();
    }, []);

    const loadBillingData = async () => {
        setLoading(true);

        // Load ALL subscriptions (including canceled) for churn calculation
        const { data: allSubs } = await supabase
            .from('subscriptions')
            .select(`*, organizations (name, status)`)
            .order('created_at', { ascending: false });



        // Active subscriptions only
        const activeSubs = (allSubs || []).filter((s: Subscription) => s.status === 'active');
        setSubscriptions(activeSubs);

        // Calculate MRR from active subscriptions
        const mrr = activeSubs.reduce((sum: number, sub: Subscription) => sum + (sub.plan_amount / 100), 0);

        // Calculate churn rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Subscriptions that existed at start of period
        const subsAtStartOfMonth = (allSubs || []).filter((s: Subscription) =>
            new Date(s.created_at) < startOfMonth
        );

        // Subscriptions canceled this month
        const canceledThisMonth = (allSubs || []).filter((s: Subscription) =>
            s.status === 'canceled' &&
            s.canceled_at &&
            new Date(s.canceled_at) >= startOfMonth
        );

        // New subscriptions this month
        const newThisMonth = (allSubs || []).filter((s: Subscription) =>
            new Date(s.created_at) >= startOfMonth && s.status === 'active'
        );

        const churnRate = subsAtStartOfMonth.length > 0
            ? (canceledThisMonth.length / subsAtStartOfMonth.length) * 100
            : 0;

        setStats({
            mrr,
            arr: mrr * 12,
            activeSubscriptions: activeSubs.length,
            churnRate: Math.round(churnRate * 10) / 10,
            churnedThisMonth: canceledThisMonth.length,
            newThisMonth: newThisMonth.length,
        });

        // Load recent invoices
        const { data: invs } = await supabase
            .from('stripe_invoices')
            .select(`*, organizations (name)`)
            .order('created_at', { ascending: false })
            .limit(50);

        setInvoices(invs || []);
        setLoading(false);
    };

    const handleCancelSubscription = async (sub: Subscription) => {
        if (!confirm(`Are you sure you want to cancel the subscription for ${sub.organizations?.name}?`)) {
            return;
        }

        try {
            // Call Stripe API to cancel (via Edge Function)
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subscription_id: sub.stripe_subscription_id }),
            });

            if (!response.ok) {
                throw new Error('Failed to cancel subscription');
            }

            // Update local state
            await supabase
                .from('subscriptions')
                .update({
                    status: 'canceled',
                    canceled_at: new Date().toISOString(),
                    cancel_at_period_end: true
                })
                .eq('id', sub.id);

            toast.success('Subscription canceled successfully');
            loadBillingData();
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error('Failed to cancel subscription');
        }
        setActionMenu(null);
    };

    const openStripeCustomer = (customerId: string) => {
        window.open(`https://dashboard.stripe.com/customers/${customerId}`, '_blank');
    };

    const openStripeSubscription = (subscriptionId: string) => {
        window.open(`https://dashboard.stripe.com/subscriptions/${subscriptionId}`, '_blank');
    };

    const getStatusBadge = (status: string, cancelAtEnd?: boolean) => {
        if (cancelAtEnd) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                    <Clock className="w-3 h-3" />
                    Canceling
                </span>
            );
        }

        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                    </span>
                );
            case 'past_due':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Past Due
                    </span>
                );
            case 'canceled':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                        <XCircle className="w-3 h-3" />
                        Canceled
                    </span>
                );
            case 'trialing':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        <Clock className="w-3 h-3" />
                        Trial
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                        {status}
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Revenue</h2>
                <button
                    onClick={loadBillingData}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            +{stats.newThisMonth} new
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeSubscriptions}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                        {stats.churnedThisMonth > 0 && (
                            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                -{stats.churnedThisMonth} lost
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Churn Rate (30d)</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.churnRate}%</p>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Subscriptions</h3>
                    <span className="text-sm text-gray-500">{subscriptions.length} total</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Plan</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Next Billing</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No active subscriptions found
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {sub.organizations?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 capitalize">
                                            {sub.plan_name}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                            ${(sub.plan_amount / 100).toFixed(2)}/{sub.interval}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(sub.status, sub.cancel_at_period_end)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(sub.current_period_end).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => setActionMenu(actionMenu === sub.id ? null : sub.id)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>

                                            {actionMenu === sub.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                                    <div className="absolute right-6 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[180px]">
                                                        <button
                                                            onClick={() => { openStripeSubscription(sub.stripe_subscription_id); setActionMenu(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            View in Stripe
                                                        </button>
                                                        <button
                                                            onClick={() => { openStripeCustomer(sub.stripe_customer_id); setActionMenu(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Customer
                                                        </button>
                                                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                                        <button
                                                            onClick={() => handleCancelSubscription(sub)}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Cancel Subscription
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
            </div>

            {/* Invoices Table */}
            {invoices.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Invoices</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Invoice ID</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            {inv.stripe_invoice_id?.slice(-8)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {inv.organizations?.name || 'Unknown'}
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
                                        <td className="px-6 py-4 text-right">
                                            {inv.invoice_pdf && (
                                                <a
                                                    href={inv.invoice_pdf}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    PDF
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
