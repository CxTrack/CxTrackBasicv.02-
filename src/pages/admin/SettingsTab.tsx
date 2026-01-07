import { useState } from 'react';
import { Shield, Bell, Database, RefreshCw, Check, Loader2, Trash2 } from 'lucide-react';
import { initializeDemoData } from '@/data/demoDataSeeder';
import { clearAllDemoData } from '@/config/demo.config';
import toast from 'react-hot-toast';

export const SettingsTab = () => {
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState<Record<string, number> | null>(null);

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
            const result = initializeDemoData();
            setSeedResult(result);
            toast.success('Demo data created successfully!');
        } catch (error) {
            console.error('Error seeding data:', error);
            toast.error('Failed to create demo data');
        }
        setIsSeeding(false);
    };

    const handleClearData = () => {
        if (!confirm('Are you sure you want to clear all demo data? This cannot be undone.')) return;
        clearAllDemoData();
        setSeedResult(null);
        toast.success('All demo data cleared');
        window.location.reload();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h2>

            {/* Demo Data Management */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    Demo Data Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Initialize realistic demo data to test all CRM features including customers, leads, opportunities, tasks, calls, invoices, and quotes.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                    >
                        {isSeeding ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating Data...
                            </>
                        ) : seedResult ? (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Refresh Demo Data
                            </>
                        ) : (
                            <>
                                <Database className="w-4 h-4" />
                                Initialize Demo Data
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleClearData}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear All Data
                    </button>
                </div>

                {seedResult && (
                    <div className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Demo data created successfully!
                        </p>
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{seedResult.customers}</div>
                                <div className="text-xs text-gray-500">Customers</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{seedResult.leads}</div>
                                <div className="text-xs text-gray-500">Leads</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{seedResult.opportunities}</div>
                                <div className="text-xs text-gray-500">Opportunities</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{seedResult.tasks}</div>
                                <div className="text-xs text-gray-500">Tasks</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{seedResult.calls}</div>
                                <div className="text-xs text-gray-500">Calls</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{seedResult.invoices}</div>
                                <div className="text-xs text-gray-500">Invoices</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{seedResult.quotes}</div>
                                <div className="text-xs text-gray-500">Quotes</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Security Policies
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="text-gray-700 dark:text-gray-300">Enforce 2FA for Admins</span>
                            <input type="checkbox" className="toggle" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="text-gray-700 dark:text-gray-300">Session Timeout (15m)</span>
                            <input type="checkbox" className="toggle" defaultChecked />
                        </label>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                        <Bell className="w-5 h-5 text-blue-600" />
                        System Notifications
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="text-gray-700 dark:text-gray-300">Email New User Alerts</span>
                            <input type="checkbox" className="toggle" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="text-gray-700 dark:text-gray-300">Weekly Digest</span>
                            <input type="checkbox" className="toggle" />
                        </label>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                    <Database className="w-5 h-5 text-orange-600" />
                    Maintenance Mode
                </h3>
                <p className="text-gray-500 mb-4 text-sm">Enable maintenance mode to prevent non-admin users from accessing the platform.</p>
                <button className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-medium transition-colors">
                    Enable Maintenance Mode
                </button>
            </div>
        </div>
    );
};
