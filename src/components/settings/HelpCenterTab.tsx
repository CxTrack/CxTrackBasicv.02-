/**
 * Help Center Tab Component
 * Comprehensive help documentation accessible from Settings
 */

import React, { useState } from 'react';
import {
    Search, Book, Video, FileText, MessageCircle,
    ExternalLink, PlayCircle, HelpCircle,
    Lightbulb, Zap, Users, Calendar, DollarSign,
    BarChart3, Phone, Settings, RefreshCw
} from 'lucide-react';
import { TourManager, tours } from '@/lib/tourManager';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════════════
// HELP ARTICLES DATA
// ═══════════════════════════════════════════════════════════════════════

interface HelpArticle {
    id: string;
    title: string;
    description: string;
    type: 'article' | 'video' | 'guide';
    icon: React.ElementType;
    content?: string;
}

interface HelpCategory {
    name: string;
    icon: React.ElementType;
    articles: HelpArticle[];
}

const helpCategories: HelpCategory[] = [
    {
        name: 'Getting Started',
        icon: Lightbulb,
        articles: [
            {
                id: 'quick-start',
                title: 'Quick Start Guide',
                description: 'Get up and running in 5 minutes',
                type: 'guide',
                icon: Book,
            },
            {
                id: 'video-intro',
                title: 'Video: CxTrack Overview',
                description: '10-minute walkthrough of key features',
                type: 'video',
                icon: Video,
            },
            {
                id: 'first-customer',
                title: 'Adding Your First Customer',
                description: 'How to add and manage customers',
                type: 'article',
                icon: FileText,
            },
        ],
    },
    {
        name: 'Customer Management',
        icon: Users,
        articles: [
            {
                id: 'customer-types',
                title: 'Business vs Personal Customers',
                description: 'Understanding customer types and when to use each',
                type: 'article',
                icon: FileText,
            },
            {
                id: 'customer-import',
                title: 'Importing Customers from CSV',
                description: 'Bulk import your existing customer database',
                type: 'article',
                icon: FileText,
            },
            {
                id: 'custom-fields',
                title: 'Custom Fields',
                description: 'Add custom data fields to track additional information',
                type: 'article',
                icon: FileText,
            },
        ],
    },
    {
        name: 'Sales Pipeline',
        icon: BarChart3,
        articles: [
            {
                id: 'pipeline-basics',
                title: 'Managing Your Pipeline',
                description: 'Track deals and forecast revenue',
                type: 'article',
                icon: FileText,
            },
            {
                id: 'pipeline-stages',
                title: 'Customizing Pipeline Stages',
                description: 'Set up stages that match your sales process',
                type: 'article',
                icon: FileText,
            },
            {
                id: 'pipeline-video',
                title: 'Video: Pipeline Mastery',
                description: 'Advanced pipeline techniques',
                type: 'video',
                icon: Video,
            },
        ],
    },
    {
        name: 'Quotes & Invoices',
        icon: DollarSign,
        articles: [
            {
                id: 'create-quote',
                title: 'Creating Professional Quotes',
                description: 'Build and send quotes to customers',
                type: 'article',
                icon: FileText,
            },
            {
                id: 'invoice-payments',
                title: 'Invoicing & Payments',
                description: 'Send invoices and collect payments',
                type: 'article',
                icon: FileText,
            },
            {
                id: 'templates',
                title: 'Document Templates',
                description: 'Customize your quote and invoice designs',
                type: 'article',
                icon: FileText,
            },
        ],
    },
    {
        name: 'AI CoPilot',
        icon: Zap,
        articles: [
            {
                id: 'copilot-intro',
                title: 'Getting Started with CoPilot',
                description: 'How to use your AI assistant effectively',
                type: 'guide',
                icon: Book,
            },
            {
                id: 'copilot-prompts',
                title: 'Example Prompts',
                description: "Try these prompts to unlock CoPilot's power",
                type: 'article',
                icon: Lightbulb,
            },
            {
                id: 'copilot-context',
                title: 'Personalizing CoPilot',
                description: 'Set up your profile for better AI responses',
                type: 'article',
                icon: FileText,
            },
        ],
    },
    {
        name: 'Calendar & Scheduling',
        icon: Calendar,
        articles: [
            {
                id: 'calendar-basics',
                title: 'Calendar Overview',
                description: 'Schedule appointments and manage your time',
                type: 'article',
                icon: FileText,
            },
            {
                id: 'calendar-sync',
                title: 'Calendar Integration',
                description: 'Sync with Google Calendar and Outlook',
                type: 'article',
                icon: FileText,
            },
        ],
    },
    {
        name: 'Calls & Communication',
        icon: Phone,
        articles: [
            {
                id: 'call-logging',
                title: 'Logging Calls',
                description: 'Track all your customer communications',
                type: 'article',
                icon: FileText,
            },
            {
                id: 'ai-calls',
                title: 'AI-Powered Calls',
                description: 'How to make automated calls with AI agents',
                type: 'guide',
                icon: Book,
            },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const HelpCenterTab: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

    // Filter articles based on search
    const filteredCategories = helpCategories.map(category => ({
        ...category,
        articles: category.articles.filter(
            article =>
                article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter(category => category.articles.length > 0);

    const handleRestartTour = async (tourId: string) => {
        await TourManager.clearTourProgress(tourId);
        toast.success(`${tours[tourId]?.name || 'Tour'} will start on next page load`);
        // Optionally reload for tours that need it
        if (tourId === 'first_login') {
            window.location.href = '/';
        }
    };

    const handleResetAllTours = async () => {
        await TourManager.resetAllTours();
        await TourManager.resetAllTooltips();
        toast.success('All tours and tooltips have been reset');
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Help Center
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Find answers, watch tutorials, and learn how to use CxTrack
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search for help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => handleRestartTour('first_login')}
                    className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl hover:shadow-lg transition-all group text-left"
                >
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                        Restart Tour
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Take the welcome tour again
                    </p>
                </button>

                <a
                    href="mailto:support@cxtrack.com"
                    className="p-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl hover:shadow-lg transition-all group"
                >
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                        Contact Support
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get help from our team
                    </p>
                </a>

                <button
                    onClick={handleResetAllTours}
                    className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl hover:shadow-lg transition-all group text-left"
                >
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <RefreshCw className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                        Reset All Tours
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Show all tips and tours again
                    </p>
                </button>
            </div>

            {/* Available Tours */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-blue-600" />
                        Interactive Tours
                    </h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.values(tours).map(tour => (
                        <button
                            key={tour.id}
                            onClick={() => handleRestartTour(tour.id)}
                            className="flex items-center gap-4 p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                <PlayCircle className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {tour.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    {tour.steps.length} steps
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Articles by Category */}
            {filteredCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                    <div
                        key={category.name}
                        className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <CategoryIcon className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {category.name}
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {category.articles.map(article => {
                                const ArticleIcon = article.icon;
                                return (
                                    <button
                                        key={article.id}
                                        onClick={() => setSelectedArticle(article)}
                                        className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group text-left"
                                    >
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                            <ArticleIcon className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {article.title}
                                                </h4>
                                                {article.type === 'video' && (
                                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-semibold rounded-full">
                                                        VIDEO
                                                    </span>
                                                )}
                                                {article.type === 'guide' && (
                                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-xs font-semibold rounded-full">
                                                        GUIDE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {article.description}
                                            </p>
                                        </div>
                                        <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Keyboard Shortcuts */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { key: '/', action: 'Global search' },
                        { key: 'N', action: 'New customer' },
                        { key: 'C', action: 'Open calendar' },
                        { key: 'P', action: 'Open pipeline' },
                        { key: 'Q', action: 'New quote' },
                        { key: '?', action: 'Show shortcuts' },
                    ].map(shortcut => (
                        <div key={shortcut.key} className="flex items-center gap-3">
                            <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                                {shortcut.key}
                            </kbd>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {shortcut.action}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Article Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedArticle.title}
                            </h3>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <HelpCircle className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {selectedArticle.description}
                            </p>
                            <div className="prose dark:prose-invert max-w-none">
                                <p>
                                    This help article is coming soon. In the meantime, you can:
                                </p>
                                <ul>
                                    <li>Use the AI CoPilot to ask questions</li>
                                    <li>Contact support for personalized help</li>
                                    <li>Take an interactive tour of the feature</li>
                                </ul>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                            >
                                Close
                            </button>
                            <a
                                href="mailto:support@cxtrack.com"
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpCenterTab;
