import React from 'react';
import { Calendar, ChevronDown, Filter, X } from 'lucide-react';

export interface FilterOption {
    id: string;
    label: string;
    options: { value: string; label: string }[];
    value?: string;
    onChange: (value: string) => void;
}

interface FilterBarProps {
    filters: FilterOption[];
    dateRange?: {
        value: string;
        onChange: (value: string) => void;
    };
    onClearAll?: () => void;
    children?: React.ReactNode;
}

const DATE_RANGES = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'all', label: 'All Time' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
    filters,
    dateRange,
    onClearAll,
    children,
}) => {
    const hasActiveFilters = filters.some(f => f.value && f.value !== 'all');

    return (
        <div className="flex items-center gap-2 py-2 px-1 flex-wrap">
            {/* Date Range */}
            {dateRange && (
                <div className="relative">
                    <select
                        value={dateRange.value}
                        onChange={(e) => dateRange.onChange(e.target.value)}
                        className="appearance-none pl-8 pr-8 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700 rounded-lg
              text-gray-700 dark:text-gray-300 cursor-pointer
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {DATE_RANGES.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
            )}

            {/* Divider */}
            {dateRange && filters.length > 0 && (
                <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
            )}

            {/* Filters */}
            {filters.map(filter => (
                <div key={filter.id} className="relative">
                    <select
                        value={filter.value || 'all'}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className={`appearance-none pl-3 pr-7 py-1.5 text-sm font-medium 
              border rounded-lg cursor-pointer transition-colors
              ${filter.value && filter.value !== 'all'
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        <option value="all">{filter.label}</option>
                        {filter.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
            ))}

            {/* Clear All */}
            {hasActiveFilters && onClearAll && (
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-500 
            hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
            hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <X className="w-3 h-3" />
                    Clear
                </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Additional actions (children) */}
            {children}
        </div>
    );
};

// Compact metric component for horizontal display
interface MetricItemProps {
    label: string;
    value: string | number;
    change?: { value: number; isPositive: boolean };
    onClick?: () => void;
}

export const CompactMetric: React.FC<MetricItemProps> = ({ label, value, change, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
      ${onClick ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer' : 'cursor-default'}`}
    >
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}:</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
        {change && (
            <span className={`text-xs font-medium ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {change.isPositive ? '↑' : '↓'}{Math.abs(change.value)}%
            </span>
        )}
    </button>
);

export const CompactMetricBar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`flex items-center divide-x divide-gray-200 dark:divide-gray-700 
    bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

export default FilterBar;
