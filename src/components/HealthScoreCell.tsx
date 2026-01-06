import { Info, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { calculateHealthScore, getHealthColor, getHealthLabel } from '@/utils/healthScore';

interface HealthScoreCellProps {
    organization: {
        active_users: number;
        total_users: number;
        api_calls_30d: number;
        storage_gb: number;
        calls_made: number;
        revenue: number;
        subscription_status: string;
        open_tickets: number;
        features_used: string[];
        last_login_days_ago: number;
        payment_failures: number;
        error_rate: number;
    };
}

export const HealthScoreCell = ({ organization }: HealthScoreCellProps) => {
    const health = calculateHealthScore(organization);
    const colors = getHealthColor(health.overall);
    const label = getHealthLabel(health.overall);

    const getScoreIcon = (score: number) => {
        if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
        if (score >= 60) return <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
        if (score >= 40) return <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
    };

    const getBarColor = (score: number) => {
        if (score >= 80) return 'bg-green-600';
        if (score >= 60) return 'bg-blue-600';
        if (score >= 40) return 'bg-yellow-600';
        return 'bg-red-600';
    };

    const getTextColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 dark:text-blue-400';
        if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <div className="group relative">
            {/* Main Badge */}
            <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-help
        ${colors.bg} ${colors.text} border ${colors.border}
      `}>
                <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                <span>{health.overall}% {label}</span>
                <Info className="w-3 h-3 opacity-60" />
            </div>

            {/* Hover Tooltip */}
            <div className="
        hidden group-hover:block absolute z-50 w-80 
        bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 
        rounded-2xl shadow-2xl -right-2 top-full mt-2 p-6
      ">

                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white">Health Breakdown</h4>
                    <span className={`text-2xl font-bold ${colors.text}`}>
                        {health.overall}%
                    </span>
                </div>

                {/* Metrics */}
                <div className="space-y-4">

                    {/* User Engagement */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getScoreIcon(health.engagement)}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    User Engagement
                                </span>
                            </div>
                            <span className={`text-sm font-bold ${getTextColor(health.engagement)}`}>
                                {health.engagement}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${getBarColor(health.engagement)}`}
                                style={{ width: `${health.engagement}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {organization.active_users}/{organization.total_users} active users
                        </p>
                    </div>

                    {/* Feature Adoption */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getScoreIcon(health.adoption)}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Feature Adoption
                                </span>
                            </div>
                            <span className={`text-sm font-bold ${getTextColor(health.adoption)}`}>
                                {health.adoption}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${getBarColor(health.adoption)}`}
                                style={{ width: `${health.adoption}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {organization.features_used.length}/5 features used
                        </p>
                    </div>

                    {/* Payment Status */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getScoreIcon(health.payment)}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Payment Health
                                </span>
                            </div>
                            <span className={`text-sm font-bold ${getTextColor(health.payment)}`}>
                                {health.payment}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${getBarColor(health.payment)}`}
                                style={{ width: `${health.payment}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                            {organization.subscription_status} • {organization.payment_failures} failures
                        </p>
                    </div>

                    {/* Support Health */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getScoreIcon(health.support)}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Support Health
                                </span>
                            </div>
                            <span className={`text-sm font-bold ${getTextColor(health.support)}`}>
                                {health.support}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${getBarColor(health.support)}`}
                                style={{ width: `${health.support}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {organization.open_tickets} open tickets
                        </p>
                    </div>

                    {/* Technical Health */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getScoreIcon(health.technical)}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Technical Health
                                </span>
                            </div>
                            <span className={`text-sm font-bold ${getTextColor(health.technical)}`}>
                                {health.technical}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${getBarColor(health.technical)}`}
                                style={{ width: `${health.technical}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {organization.error_rate}% error rate
                        </p>
                    </div>

                </div>

                {/* Footer with Action */}
                {health.overall < 70 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors">
                            Review Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
