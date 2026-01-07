import React, { useState } from 'react';
import { Download, FileText, Table, FileSpreadsheet, X, Calendar, Filter, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export type ReportType = 'invoices' | 'quotes' | 'customers' | 'pipeline' | 'tasks' | 'calls' | 'revenue';
export type ExportFormat = 'pdf' | 'csv' | 'excel';

interface ReportGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    defaultType?: ReportType;
    onGenerate?: (config: ReportConfig) => void;
}

export interface ReportConfig {
    type: ReportType;
    format: ExportFormat;
    dateRange: { start: string; end: string };
    filters: Record<string, string>;
    title?: string;
}

const REPORT_TYPES: { id: ReportType; label: string; icon: React.ReactNode }[] = [
    { id: 'invoices', label: 'Invoices Report', icon: <FileText className="w-4 h-4" /> },
    { id: 'quotes', label: 'Quotes Report', icon: <FileText className="w-4 h-4" /> },
    { id: 'customers', label: 'Customer Report', icon: <FileText className="w-4 h-4" /> },
    { id: 'pipeline', label: 'Pipeline Report', icon: <FileText className="w-4 h-4" /> },
    { id: 'tasks', label: 'Task Report', icon: <FileText className="w-4 h-4" /> },
    { id: 'revenue', label: 'Revenue Report', icon: <FileText className="w-4 h-4" /> },
];

const EXPORT_FORMATS: { id: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { id: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4 text-red-500" /> },
    { id: 'csv', label: 'CSV', icon: <Table className="w-4 h-4 text-green-500" /> },
    { id: 'excel', label: 'Excel', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> },
];

const FILTER_OPTIONS: Record<ReportType, { id: string; label: string; options: string[] }[]> = {
    invoices: [
        { id: 'status', label: 'Status', options: ['All', 'Paid', 'Pending', 'Overdue'] },
        { id: 'customer_type', label: 'Customer Type', options: ['All', 'Business', 'Personal'] },
    ],
    quotes: [
        { id: 'status', label: 'Status', options: ['All', 'Draft', 'Sent', 'Accepted', 'Declined'] },
        { id: 'customer_type', label: 'Customer Type', options: ['All', 'Business', 'Personal'] },
    ],
    customers: [
        { id: 'type', label: 'Type', options: ['All', 'Business', 'Personal'] },
        { id: 'source', label: 'Source', options: ['All', 'Referral', 'Website', 'Cold Call', 'Other'] },
    ],
    pipeline: [
        { id: 'stage', label: 'Stage', options: ['All', 'Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed'] },
        { id: 'probability', label: 'Probability', options: ['All', 'Low (<25%)', 'Medium (25-75%)', 'High (>75%)'] },
    ],
    tasks: [
        { id: 'status', label: 'Status', options: ['All', 'Pending', 'In Progress', 'Completed'] },
        { id: 'priority', label: 'Priority', options: ['All', 'Low', 'Medium', 'High', 'Urgent'] },
    ],
    calls: [
        { id: 'type', label: 'Type', options: ['All', 'Inbound', 'Outbound'] },
        { id: 'outcome', label: 'Outcome', options: ['All', 'Completed', 'No Answer', 'Voicemail', 'Busy'] },
    ],
    revenue: [
        { id: 'source', label: 'Source', options: ['All', 'Invoices', 'Subscriptions'] },
        { id: 'customer_type', label: 'Customer Type', options: ['All', 'Business', 'Personal'] },
    ],
};

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
    isOpen,
    onClose,
    defaultType = 'invoices',
    onGenerate,
}) => {
    const [reportType, setReportType] = useState<ReportType>(defaultType);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setIsGenerating(true);

        const config: ReportConfig = {
            type: reportType,
            format: exportFormat,
            dateRange,
            filters,
        };

        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (onGenerate) {
            onGenerate(config);
        }

        toast.success(`${REPORT_TYPES.find(r => r.id === reportType)?.label} generated!`);
        setIsGenerating(false);
        onClose();
    };

    const currentFilters = FILTER_OPTIONS[reportType] || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Generate Report</h3>
                            <p className="text-xs text-gray-500">Export data in your preferred format</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* Report Type */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Report Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {REPORT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => { setReportType(type.id); setFilters({}); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${reportType === type.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {type.icon}
                                    <span className="truncate">{type.label.replace(' Report', '')}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Date Range
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg
                  text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg
                  text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    {currentFilters.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                <Filter className="w-3 h-3 inline mr-1" />
                                Filters
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {currentFilters.map(filter => (
                                    <select
                                        key={filter.id}
                                        value={filters[filter.id] || 'All'}
                                        onChange={(e) => setFilters(prev => ({ ...prev, [filter.id]: e.target.value }))}
                                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg
                      text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-blue-500"
                                    >
                                        {filter.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Export Format */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Export Format
                        </label>
                        <div className="flex gap-2">
                            {EXPORT_FORMATS.map(format => (
                                <button
                                    key={format.id}
                                    onClick={() => setExportFormat(format.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${exportFormat === format.id
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {format.icon}
                                    {format.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
              hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white 
              bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Generate Report
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Export button for inline use
interface ExportButtonProps {
    onExport: (format: ExportFormat) => void;
    formats?: ExportFormat[];
    size?: 'sm' | 'md';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
    onExport,
    formats = ['pdf', 'csv', 'excel'],
    size = 'md',
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 font-medium border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
          text-gray-700 dark:text-gray-300 rounded-lg transition-colors
          ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
            >
                <Download className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
                Export
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg 
            border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                        {EXPORT_FORMATS.filter(f => formats.includes(f.id)).map(format => (
                            <button
                                key={format.id}
                                onClick={() => { onExport(format.id); setIsOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {format.icon}
                                {format.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportGenerator;
