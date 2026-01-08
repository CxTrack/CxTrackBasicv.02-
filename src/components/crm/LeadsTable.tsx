import React, { useState } from 'react';
import { useCRMStore } from '@/stores/crmStore';
import { useThemeStore } from '@/stores/themeStore';
import { Lead } from '@/types/database.types';
import {
    MoreVertical, ArrowRight, Edit2, Trash2, User, Building2, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, Badge, IconBadge } from '@/components/theme/ThemeComponents';

export default function LeadsTable() {
    const [showScoreInfo, setShowScoreInfo] = React.useState(false);
    const { leads, loading, updateLead, deleteLead, convertLeadToOpportunity } = useCRMStore();
    const { theme } = useThemeStore();

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'new': return 'info';
            case 'contacted': return 'warning';
            case 'nurturing': return 'default';
            case 'qualified': return 'success';
            case 'dead': return 'error';
            default: return 'default';
        }
    };

    if (loading && leads.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className={theme === 'soft-modern' ? "bg-slate-50 border-b border-slate-200" : "bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700"}>
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center gap-1 relative">
                                    Score
                                    <button
                                        onClick={() => setShowScoreInfo(!showScoreInfo)}
                                        onMouseEnter={() => setShowScoreInfo(true)}
                                        onMouseLeave={() => setShowScoreInfo(false)}
                                        className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        title="What is Lead Score?"
                                    >
                                        <Info size={12} className="text-gray-400" />
                                    </button>
                                    {showScoreInfo && (
                                        <div className="absolute z-50 top-full left-0 mt-1 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-left normal-case tracking-normal">
                                            <p className="text-xs text-gray-600 dark:text-gray-300 font-normal leading-relaxed">
                                                <strong className="text-gray-900 dark:text-white">Lead Score (0-100)</strong><br />
                                                A rating that indicates how likely a lead is to convert. Higher scores suggest better engagement and higher potential value.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${theme === 'soft-modern' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {lead.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{lead.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-2">
                                        {lead.company && <Building2 size={14} className="text-gray-400" />}
                                        {lead.company || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={getStatusVariant(lead.status) as any}>
                                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${lead.lead_score > 70 ? 'bg-green-500' :
                                                    lead.lead_score > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${Math.min(lead.lead_score, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{lead.lead_score}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    ${lead.potential_value.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                    {lead.last_contact_date ? format(new Date(lead.last_contact_date), 'MMM d, yyyy') : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => convertLeadToOpportunity(lead.id, new Date())}
                                            title="Convert to Opportunity"
                                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded transition-colors"
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                        <button
                                            title="Edit"
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {(
                                            <button
                                                onClick={() => deleteLead(lead.id)}
                                                title="Delete"
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No leads found. Add a new lead to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
