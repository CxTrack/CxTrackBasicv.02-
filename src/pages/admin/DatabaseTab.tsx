import { RefreshCw, Server, AlertTriangle } from 'lucide-react';

export const DatabaseTab = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Database Management</h2>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-6">
                        <Server className="w-5 h-5 text-blue-600" />
                        Storage Usage
                    </h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">4.2</span>
                        <span className="text-gray-500 mb-1">GB used</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-sm text-gray-500">45% of 10GB limit (Professional Plan)</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-6">
                        <RefreshCw className="w-5 h-5 text-green-600" />
                        Connection Pool
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 dark:text-gray-400">Active Connections</span>
                        <span className="font-mono font-bold">12 / 50</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Idle Connections</span>
                        <span className="font-mono font-bold">3</span>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-200 dark:border-amber-900">
                <h3 className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200 mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                </h3>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium shadow-sm transition-colors">
                        Clear Cache
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors">
                        Reset Database Connections
                    </button>
                </div>
            </div>
        </div>
    );
};
