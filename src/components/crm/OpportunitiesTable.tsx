import React, { useState } from 'react';
import { useCRMStore } from '@/stores/crmStore';
import { useThemeStore } from '@/stores/themeStore';
import { Opportunity } from '@/types/database.types';
import { format } from 'date-fns';
import {
    MoreVertical, FileText, CheckCircle, XCircle,
    Edit2, Calendar, Target, TrendingUp, Info
} from 'lucide-react';
import { Card, Badge } from '@/components/theme/ThemeComponents';

export default function OpportunitiesTable() {
    const { opportunities, loading, markOpportunityWon, markOpportunityLost } = useCRMStore();
    const [showProbabilityInfo, setShowProbabilityInfo] = React.useState(false);
    const { theme } = useThemeStore();

    const getStageVariant = (stage: string) => {
        switch (stage) {
            case 'discovery': return 'info';
            case 'demo_scheduled': return 'warning';
            case 'proposal': return 'warning'; // Orange usually maps to warning or custom
            case 'negotiation': return 'warning';
            case 'won': return 'success';
            case 'lost': return 'error';
            default: return 'default';
        }
    };

    const activeOpportunities = opportunities.filter(o => !['won', 'lost'].includes(o.stage));

    if (loading && opportunities.length === 0) {
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
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opportunity</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stage</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center gap-1 relative">
                                    Probability
                                    <button
                                        onClick={() => setShowProbabilityInfo(!showProbabilityInfo)}
                                        onMouseEnter={() => setShowProbabilityInfo(true)}
                                        onMouseLeave={() => setShowProbabilityInfo(false)}
                                        className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        title="What is Probability?"
                                    >
                                        <Info size={12} className="text-gray-400" />
                                    </button>
                                    {showProbabilityInfo && (
                                        <div className="absolute z-50 top-full left-0 mt-1 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-left normal-case tracking-normal">
                                            <p className="text-xs text-gray-600 dark:text-gray-300 font-normal leading-relaxed">
                                                <strong className="text-gray-900 dark:text-white">Win Probability (%)</strong><br />
                                                The estimated likelihood of closing this opportunity successfully. Used to calculate weighted pipeline value (Value × Probability).
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weighted</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expected Close</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {activeOpportunities.map((opp) => (
                            <tr key={opp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${theme === 'soft-modern' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            <Target size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {opp.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                {opp.appointment_date ? (
                                                    <>
                                                        <Calendar size={10} />
                                                        {format(new Date(opp.appointment_date), 'MMM d, h:mm a')}
                                                    </>
                                                ) : 'No Apt'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={getStageVariant(opp.stage) as any}>
                                        {opp.stage.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                    ${opp.value.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${opp.probability * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{(opp.probability * 100).toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                    ${Math.round(opp.value * opp.probability).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    {opp.expected_close_date ? format(new Date(opp.expected_close_date), 'MMM d, yyyy') : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => markOpportunityWon(opp.id)}
                                            title="Mark Won"
                                            className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 rounded transition-colors"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                        <button
                                            title="Create Quote"
                                            className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded transition-colors"
                                        >
                                            <FileText size={16} />
                                        </button>
                                        <button
                                            title="Edit"
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => markOpportunityLost(opp.id, 'Unknown')}
                                            title="Mark Lost"
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {activeOpportunities.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No active opportunities.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
