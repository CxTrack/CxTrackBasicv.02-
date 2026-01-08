/**
 * ResizableTable - Compact data table with drag-to-resize columns
 * Provides Supabase-like data-dense interface with user-adjustable column widths
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface ColumnDef<T = any> {
    id: string;
    header: string;
    minWidth?: number;
    defaultWidth?: number;
    align?: 'left' | 'center' | 'right';
    render: (row: T, index: number) => React.ReactNode;
}

interface ResizableTableProps<T = any> {
    columns: ColumnDef<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    onSort?: (columnId: string) => void;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    storageKey?: string; // For persisting column widths
    className?: string;
    maxHeight?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// RESIZABLE TABLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════

// Cache version - increment this to force reset of saved column widths
const CACHE_VERSION = 2;

export const ResizableTable = <T extends any>({
    columns,
    data,
    onRowClick,
    onSort,
    sortColumn,
    sortDirection,
    storageKey,
    className = '',
    maxHeight = 'calc(100vh - 380px)',
}: ResizableTableProps<T>) => {
    // Initialize column widths from localStorage or defaults
    const getInitialWidths = useCallback(() => {
        if (storageKey) {
            try {
                const versionKey = `table-widths-version-${storageKey}`;
                const savedVersion = localStorage.getItem(versionKey);

                // Invalidate cache if version mismatch
                if (savedVersion !== String(CACHE_VERSION)) {
                    localStorage.removeItem(`table-widths-${storageKey}`);
                    localStorage.setItem(versionKey, String(CACHE_VERSION));
                } else {
                    const saved = localStorage.getItem(`table-widths-${storageKey}`);
                    if (saved) {
                        return JSON.parse(saved);
                    }
                }
            } catch (e) {
                console.warn('Failed to load saved column widths');
            }
        }

        const widths: Record<string, number> = {};
        columns.forEach((col) => {
            widths[col.id] = col.defaultWidth || 150;
        });
        return widths;
    }, [columns, storageKey]);

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(getInitialWidths);
    const [resizing, setResizing] = useState<string | null>(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);
    const tableRef = useRef<HTMLDivElement>(null);

    // Save column widths to localStorage
    useEffect(() => {
        if (storageKey && !resizing) {
            localStorage.setItem(`table-widths-${storageKey}`, JSON.stringify(columnWidths));
        }
    }, [columnWidths, storageKey, resizing]);

    // Handle mouse down on resize handle
    const handleMouseDown = useCallback((e: React.MouseEvent, columnId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(columnId);
        setStartX(e.clientX);
        setStartWidth(columnWidths[columnId] || 150);
    }, [columnWidths]);

    // Handle mouse move during resize
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizing) return;

        const diff = e.clientX - startX;
        const minWidth = columns.find(c => c.id === resizing)?.minWidth || 50;
        const newWidth = Math.max(minWidth, startWidth + diff);

        setColumnWidths(prev => ({
            ...prev,
            [resizing]: newWidth,
        }));
    }, [resizing, startX, startWidth, columns]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setResizing(null);
    }, []);

    // Add/remove global event listeners for resize
    useEffect(() => {
        if (resizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [resizing, handleMouseMove, handleMouseUp]);

    // Calculate total table width
    const totalWidth = Object.values(columnWidths).reduce((sum, w) => sum + w, 0);

    return (
        <div
            ref={tableRef}
            className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}
        >
            {/* Header */}
            <div
                className="flex bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700"
                style={{ minWidth: totalWidth }}
            >
                {columns.map((col, index) => (
                    <div
                        key={col.id}
                        className={`relative flex items-center px-3 py-2 ${onSort ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
                        style={{ width: columnWidths[col.id] || col.defaultWidth || 150 }}
                        onClick={() => onSort && onSort(col.id)}
                    >
                        <span className={`text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate flex-1 flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                            }`}>
                            {col.header}
                            {sortColumn === col.id && (
                                <span className="text-gray-400">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                            )}
                        </span>

                        {/* Resize Handle */}
                        {index < columns.length - 1 && (
                            <div
                                className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group ${resizing === col.id ? 'bg-blue-500' : 'hover:bg-blue-400'
                                    }`}
                                onMouseDown={(e) => handleMouseDown(e, col.id)}
                            >
                                <div className={`absolute inset-y-0 -left-1 -right-1 ${resizing === col.id ? '' : 'group-hover:bg-blue-400/20'
                                    }`} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Body */}
            <div
                className="overflow-y-auto overflow-x-auto"
                style={{ maxHeight }}
            >
                {data.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                        No data to display
                    </div>
                ) : (
                    data.map((row, rowIndex) => (
                        <div
                            key={(row as any).id || rowIndex}
                            onClick={() => onRowClick?.(row)}
                            className={`flex items-center border-b border-gray-100 dark:border-gray-800 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
                                } transition-colors`}
                            style={{ minWidth: totalWidth }}
                        >
                            {columns.map((col) => (
                                <div
                                    key={col.id}
                                    className={`px-3 py-2 text-sm ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                        }`}
                                    style={{ width: columnWidths[col.id] || col.defaultWidth || 150 }}
                                >
                                    {col.render(row, rowIndex)}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// DEFAULT COLUMN CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════

export const defaultInvoiceColumns: Omit<ColumnDef, 'render'>[] = [
    { id: 'invoice_number', header: 'Invoice #', defaultWidth: 130, minWidth: 100 },
    { id: 'customer', header: 'Customer', defaultWidth: 180, minWidth: 120 },
    { id: 'amount', header: 'Amount', defaultWidth: 100, minWidth: 80, align: 'right' },
    { id: 'paid', header: 'Paid', defaultWidth: 90, minWidth: 70, align: 'right' },
    { id: 'due', header: 'Due', defaultWidth: 90, minWidth: 70, align: 'right' },
    { id: 'status', header: 'Status', defaultWidth: 100, minWidth: 80 },
    { id: 'due_date', header: 'Due Date', defaultWidth: 90, minWidth: 70 },
    { id: 'actions', header: 'Actions', defaultWidth: 70, minWidth: 60, align: 'right' },
];

export const defaultQuoteColumns: Omit<ColumnDef, 'render'>[] = [
    { id: 'quote_number', header: 'Quote #', defaultWidth: 120, minWidth: 100 },
    { id: 'customer', header: 'Customer', defaultWidth: 200, minWidth: 120 },
    { id: 'amount', header: 'Amount', defaultWidth: 110, minWidth: 80, align: 'right' },
    { id: 'status', header: 'Status', defaultWidth: 100, minWidth: 80 },
    { id: 'date', header: 'Date', defaultWidth: 110, minWidth: 80 },
    { id: 'actions', header: 'Actions', defaultWidth: 70, minWidth: 60, align: 'right' },
];

export const defaultProductColumns: Omit<ColumnDef, 'render'>[] = [
    { id: 'product', header: 'Product', defaultWidth: 250, minWidth: 150 },
    { id: 'type', header: 'Type', defaultWidth: 90, minWidth: 70 },
    { id: 'category', header: 'Category', defaultWidth: 120, minWidth: 80 },
    { id: 'price', header: 'Price', defaultWidth: 80, minWidth: 60, align: 'right' },
    { id: 'stock', header: 'Stock', defaultWidth: 60, minWidth: 50, align: 'center' },
    { id: 'status', header: 'Status', defaultWidth: 80, minWidth: 60 },
    { id: 'actions', header: 'Actions', defaultWidth: 70, minWidth: 60, align: 'right' },
];

export default ResizableTable;
