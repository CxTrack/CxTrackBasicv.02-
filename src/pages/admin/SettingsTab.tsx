import { Shield, Bell, Database } from 'lucide-react';

export const SettingsTab = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h2>

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
