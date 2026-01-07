/**
 * Settings Popover Component
 * Gear icon dropdown with settings options (like Salesforce/GoHighLevel)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Settings,
    Database,
    Download,
    Upload,
    Tags,
    ChevronRight,
    X
} from 'lucide-react';

interface SettingsPopoverProps {
    onCustomFields: () => void;
    onImportCSV: () => void;
    onExportData: () => void;
    onManageTags: () => void;
}

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({
    onCustomFields,
    onImportCSV,
    onExportData,
    onManageTags
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const menuItems = [
        {
            icon: Database,
            label: 'Custom Fields',
            description: 'Add and manage custom data fields',
            onClick: onCustomFields,
            badge: null
        },
        {
            icon: Upload,
            label: 'Import CSV',
            description: 'Upload contacts from a spreadsheet',
            onClick: onImportCSV,
            badge: null
        },
        {
            icon: Download,
            label: 'Export Data',
            description: 'Download customer data as CSV',
            onClick: onExportData,
            badge: null
        },
        {
            icon: Tags,
            label: 'Manage Tags',
            description: 'Organize customers with tags',
            onClick: onManageTags,
            badge: null
        }
    ];

    return (
        <div className="relative" ref={popoverRef}>
            {/* Gear Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-all duration-200 ${isOpen
                        ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                title="Settings"
            >
                <Settings size={20} className={isOpen ? 'animate-spin-slow' : ''} />
            </button>

            {/* Popover Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings size={16} className="text-gray-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">Settings</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X size={14} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-150 group text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                                        {item.badge && (
                                            <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 text-xs font-medium rounded">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</p>
                                </div>
                                <ChevronRight size={16} className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Customize your CRM experience
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPopover;
