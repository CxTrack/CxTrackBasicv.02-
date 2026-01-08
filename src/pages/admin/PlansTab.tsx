import { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Check, X, Star, DollarSign, Clock,
    ChevronUp, ChevronDown, Zap, Users, GripVertical, MoreVertical,
    RefreshCw, Save
} from 'lucide-react';
import { usePlanStore, SubscriptionPlan } from '@/stores/planStore';
import toast from 'react-hot-toast';

export const PlansTab = () => {
    const {
        plans,
        loading,
        fetchPlans,
        createPlan,
        updatePlan,
        deletePlan,
        reorderPlans,
    } = usePlanStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [actionMenu, setActionMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await deletePlan(id);
            toast.success('Plan deleted');
        } catch {
            toast.error('Failed to delete plan');
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await updatePlan(id, { is_default: true });
            toast.success('Default plan updated');
        } catch {
            toast.error('Failed to update default plan');
        }
    };

    const handleToggleActive = async (plan: SubscriptionPlan) => {
        try {
            await updatePlan(plan.id, { is_active: !plan.is_active });
            toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`);
        } catch {
            toast.error('Failed to update plan');
        }
    };

    const formatPrice = (cents: number) => {
        if (cents === 0) return 'Free';
        return `$${(cents / 100).toFixed(0)}`;
    };

    if (loading && plans.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subscription Plans</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your pricing tiers and features</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Plan
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.sort((a, b) => a.sort_order - b.sort_order).map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative bg-white dark:bg-gray-900 rounded-2xl border-2 ${plan.is_popular ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200 dark:border-gray-700'
                            } overflow-hidden transition-all hover:shadow-lg ${!plan.is_active ? 'opacity-60' : ''
                            }`}
                    >
                        {/* Popular Badge */}
                        {plan.is_popular && (
                            <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                POPULAR
                            </div>
                        )}

                        {/* Default Badge */}
                        {plan.is_default && (
                            <div className="absolute top-0 left-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-br-xl">
                                DEFAULT
                            </div>
                        )}

                        {/* Action Menu */}
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === plan.id ? null : plan.id); }}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            {actionMenu === plan.id && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                    <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[160px]">
                                        <button
                                            onClick={() => { setEditingPlan(plan); setActionMenu(null); }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Plan
                                        </button>
                                        <button
                                            onClick={() => { handleSetDefault(plan.id); setActionMenu(null); }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <Star className="w-4 h-4" />
                                            Set as Default
                                        </button>
                                        <button
                                            onClick={() => { handleToggleActive(plan); setActionMenu(null); }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            {plan.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                            {plan.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                        <button
                                            onClick={() => { handleDeletePlan(plan.id); setActionMenu(null); }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 pt-8">
                            {/* Plan Name & Description */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{plan.description}</p>

                            {/* Price */}
                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {formatPrice(plan.price_monthly)}
                                    </span>
                                    {plan.price_monthly > 0 && (
                                        <span className="text-gray-500">/mo</span>
                                    )}
                                </div>
                                {plan.price_yearly && (
                                    <p className="text-sm text-green-600">
                                        ${(plan.price_yearly / 100).toFixed(0)}/year (save 20%)
                                    </p>
                                )}
                            </div>

                            {/* Key Metrics */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-purple-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {plan.included_minutes >= 9999 ? 'Unlimited' : plan.included_minutes} minutes
                                    </span>
                                </div>
                                {plan.overage_rate_cents > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <DollarSign className="w-4 h-4 text-orange-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            ${(plan.overage_rate_cents / 100).toFixed(2)}/min overage
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            <div className="space-y-2">
                                {plan.features.slice(0, 4).map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                                    </div>
                                ))}
                                {plan.features.length > 4 && (
                                    <p className="text-sm text-purple-600 font-medium">
                                        +{plan.features.length - 4} more features
                                    </p>
                                )}
                            </div>

                            {/* Stripe IDs */}
                            {(plan.stripe_price_id_monthly || plan.stripe_price_id_yearly) && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500">
                                        <Zap className="w-3 h-3 inline mr-1" />
                                        Stripe Connected
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Usage Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 How Plans Work</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Default Plan</strong> is auto-assigned to new users</li>
                    <li>• <strong>Included Minutes</strong> are the base minutes each billing cycle</li>
                    <li>• <strong>Overage Rate</strong> is charged for minutes beyond the included amount</li>
                    <li>• Add <strong>Stripe Price IDs</strong> to enable automated billing</li>
                </ul>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingPlan) && (
                <PlanModal
                    plan={editingPlan}
                    onClose={() => { setShowCreateModal(false); setEditingPlan(null); }}
                    onSave={async (data) => {
                        try {
                            if (editingPlan) {
                                await updatePlan(editingPlan.id, data);
                                toast.success('Plan updated');
                            } else {
                                await createPlan(data);
                                toast.success('Plan created');
                            }
                            setShowCreateModal(false);
                            setEditingPlan(null);
                        } catch {
                            toast.error('Failed to save plan');
                        }
                    }}
                />
            )}
        </div>
    );
};

// Plan Create/Edit Modal
const PlanModal = ({
    plan,
    onClose,
    onSave,
}: {
    plan: SubscriptionPlan | null;
    onClose: () => void;
    onSave: (data: Partial<SubscriptionPlan>) => Promise<void>;
}) => {
    const [formData, setFormData] = useState({
        name: plan?.name || '',
        slug: plan?.slug || '',
        description: plan?.description || '',
        price_monthly: plan?.price_monthly ? plan.price_monthly / 100 : 0,
        price_yearly: plan?.price_yearly ? plan.price_yearly / 100 : 0,
        included_minutes: plan?.included_minutes || 50,
        overage_rate_cents: plan?.overage_rate_cents || 10,
        features: plan?.features?.join('\n') || '',
        is_active: plan?.is_active ?? true,
        is_popular: plan?.is_popular ?? false,
        stripe_price_id_monthly: plan?.stripe_price_id_monthly || '',
        stripe_price_id_yearly: plan?.stripe_price_id_yearly || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error('Plan name is required');
            return;
        }
        setSaving(true);
        try {
            await onSave({
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                description: formData.description,
                price_monthly: Math.round(formData.price_monthly * 100),
                price_yearly: formData.price_yearly ? Math.round(formData.price_yearly * 100) : undefined,
                included_minutes: formData.included_minutes,
                overage_rate_cents: formData.overage_rate_cents,
                features: formData.features.split('\n').filter(f => f.trim()),
                is_active: formData.is_active,
                is_popular: formData.is_popular,
                stripe_price_id_monthly: formData.stripe_price_id_monthly || undefined,
                stripe_price_id_yearly: formData.stripe_price_id_yearly || undefined,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {plan ? 'Edit Plan' : 'Create New Plan'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                placeholder="e.g., Pro"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                placeholder="e.g., pro"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                            placeholder="Brief description of this plan"
                        />
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price ($)</label>
                            <input
                                type="number"
                                value={formData.price_monthly}
                                onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yearly Price ($)</label>
                            <input
                                type="number"
                                value={formData.price_yearly}
                                onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Minutes & Overage */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Included Minutes</label>
                            <input
                                type="number"
                                value={formData.included_minutes}
                                onChange={(e) => setFormData({ ...formData, included_minutes: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Overage Rate (¢/min)</label>
                            <input
                                type="number"
                                value={formData.overage_rate_cents}
                                onChange={(e) => setFormData({ ...formData, overage_rate_cents: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Features (one per line)</label>
                        <textarea
                            value={formData.features}
                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                            rows={5}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
                            placeholder="AI Voice Agent
Full CRM Access
100 Minutes Included"
                        />
                    </div>

                    {/* Stripe IDs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stripe Monthly Price ID</label>
                            <input
                                type="text"
                                value={formData.stripe_price_id_monthly}
                                onChange={(e) => setFormData({ ...formData, stripe_price_id_monthly: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white font-mono text-sm"
                                placeholder="price_..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stripe Yearly Price ID</label>
                            <input
                                type="text"
                                value={formData.stripe_price_id_yearly}
                                onChange={(e) => setFormData({ ...formData, stripe_price_id_yearly: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white font-mono text-sm"
                                placeholder="price_..."
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-5 h-5 rounded text-purple-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_popular}
                                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                                className="w-5 h-5 rounded text-purple-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Mark as Popular</span>
                        </label>
                    </div>

                    {/* Actions */}
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
                            disabled={saving}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
