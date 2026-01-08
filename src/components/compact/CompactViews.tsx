/**
 * Compact View Component for Data-Dense Lists
 * Supabase-inspired design - shows 15-20 items on laptop screen
 */

import React from 'react';
import { Edit, MoreVertical, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════
// COMPACT PRODUCT ROW
// ═══════════════════════════════════════════════════════════════════════

interface ProductRowProps {
    product: {
        id: string;
        name: string;
        sku?: string;
        category?: string;
        product_type: string;
        price: number;
        quantity_on_hand?: number;
        is_active: boolean;
        track_inventory?: boolean;
    };
    onDelete?: (id: string) => void;
    canEdit?: boolean;
}

export const CompactProductRow: React.FC<ProductRowProps> = ({ product, onDelete, canEdit }) => {
    return (
        <div className="grid grid-cols-[1fr_80px_120px_70px_50px_70px_60px] gap-4 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center text-sm border-b border-gray-100 dark:border-gray-800 last:border-0">
            {/* Product Name + SKU */}
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {product.name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <Link
                        to={`/products/${product.id}`}
                        className="font-medium text-gray-900 dark:text-white text-sm truncate block hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        {product.name}
                    </Link>
                    {product.sku && (
                        <span className="text-[11px] text-gray-400 font-mono truncate block">{product.sku}</span>
                    )}
                </div>
            </div>

            {/* Type */}
            <div>
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${product.product_type === 'service' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    product.product_type === 'bundle' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                    {product.product_type}
                </span>
            </div>

            {/* Category */}
            <div className="text-gray-600 dark:text-gray-400 text-sm truncate">
                {product.category || '—'}
            </div>

            {/* Price */}
            <div className="text-right font-semibold text-gray-900 dark:text-white">
                ${product.price.toFixed(0)}
            </div>

            {/* Stock */}
            <div className="text-center">
                {product.track_inventory ? (
                    <span className={`text-sm font-medium ${(product.quantity_on_hand || 0) > 20 ? 'text-green-600' :
                        (product.quantity_on_hand || 0) > 5 ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>
                        {product.quantity_on_hand || 0}
                    </span>
                ) : (
                    <span className="text-gray-400">—</span>
                )}
            </div>

            {/* Status */}
            <div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${product.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                    {product.is_active ? 'Active' : 'Off'}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-0.5">
                <Link to={`/products/${product.id}`} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100">
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                </Link>
                {canEdit && onDelete && (
                    <button onClick={() => onDelete(product.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded opacity-60 hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                    </button>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// COMPACT QUOTE ROW
// ═══════════════════════════════════════════════════════════════════════

interface QuoteRowProps {
    quote: {
        id: string;
        quote_number: string;
        customer_name?: string;
        total: number;
        status: string;
        valid_until?: string;
        created_at: string;
        items_count?: number;
    };
    onNavigate?: (id: string) => void;
}

export const CompactQuoteRow: React.FC<QuoteRowProps> = ({ quote, onNavigate }) => {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'accepted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'sent': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'viewed': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    return (
        <div
            onClick={() => onNavigate?.(quote.id)}
            className="grid grid-cols-12 gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer"
        >
            {/* Quote Number */}
            <div className="col-span-2">
                <span className="font-semibold text-gray-900 dark:text-white">{quote.quote_number}</span>
                <span className="text-[11px] text-gray-400 block">{new Date(quote.created_at).toLocaleDateString()}</span>
            </div>

            {/* Customer */}
            <div className="col-span-3 text-gray-700 dark:text-gray-300 truncate">
                {quote.customer_name || 'No customer'}
            </div>

            {/* Amount */}
            <div className="col-span-2 text-right font-bold text-gray-900 dark:text-white">
                ${quote.total.toLocaleString()}
            </div>

            {/* Items */}
            <div className="col-span-1 text-center text-gray-500">
                {quote.items_count || 0}
            </div>

            {/* Status */}
            <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(quote.status)}`}>
                    {quote.status}
                </span>
            </div>

            {/* Valid Until */}
            <div className="col-span-1 text-[11px] text-gray-500">
                {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : '—'}
            </div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end gap-0.5">
                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100">
                    <Edit className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100">
                    <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// COMPACT INVOICE ROW
// ═══════════════════════════════════════════════════════════════════════

interface InvoiceRowProps {
    invoice: {
        id: string;
        invoice_number: string;
        customer_name?: string;
        total: number;
        amount_paid?: number;
        status: string;
        due_date?: string;
        created_at: string;
    };
    onNavigate?: (id: string) => void;
}

export const CompactInvoiceRow: React.FC<InvoiceRowProps> = ({ invoice, onNavigate }) => {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'sent': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'partial': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    const balance = invoice.total - (invoice.amount_paid || 0);

    return (
        <div
            onClick={() => onNavigate?.(invoice.id)}
            className="grid grid-cols-12 gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors items-center text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer"
        >
            {/* Invoice Number */}
            <div className="col-span-2">
                <span className="font-semibold text-gray-900 dark:text-white">{invoice.invoice_number}</span>
                <span className="text-[11px] text-gray-400 block">{new Date(invoice.created_at).toLocaleDateString()}</span>
            </div>

            {/* Customer */}
            <div className="col-span-2 text-gray-700 dark:text-gray-300 truncate">
                {invoice.customer_name || 'No customer'}
            </div>

            {/* Amount */}
            <div className="col-span-2 text-right font-bold text-gray-900 dark:text-white">
                ${invoice.total.toLocaleString()}
            </div>

            {/* Paid */}
            <div className="col-span-1 text-right text-green-600 font-medium">
                ${(invoice.amount_paid || 0).toLocaleString()}
            </div>

            {/* Balance */}
            <div className="col-span-1 text-right font-medium">
                <span className={balance > 0 ? 'text-red-600' : 'text-gray-400'}>
                    ${balance.toLocaleString()}
                </span>
            </div>

            {/* Status */}
            <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(invoice.status)}`}>
                    {invoice.status}
                </span>
            </div>

            {/* Due Date */}
            <div className="col-span-1 text-[11px] text-gray-500">
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
            </div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end gap-0.5">
                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100">
                    <Edit className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-60 hover:opacity-100">
                    <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// COMPACT TABLE HEADER
// ═══════════════════════════════════════════════════════════════════════

interface CompactHeaderProps {
    columns: { key: string; label: string; span: number; align?: 'left' | 'center' | 'right' }[];
}

export const CompactTableHeader: React.FC<CompactHeaderProps> = ({ columns }) => {
    return (
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            {columns.map((col) => (
                <div
                    key={col.key}
                    className={`col-span-${col.span} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                >
                    {col.label}
                </div>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// COMPACT STATS BAR
// ═══════════════════════════════════════════════════════════════════════

interface StatItemProps {
    label: string;
    value: string | number;
    subValue?: string;
}

export const CompactStatsBar: React.FC<{ stats: StatItemProps[] }> = ({ stats }) => {
    return (
        <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide">{stat.label}:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</span>
                    {stat.subValue && <span className="text-[11px] text-gray-400">{stat.subValue}</span>}
                </div>
            ))}
        </div>
    );
};

export default CompactProductRow;
