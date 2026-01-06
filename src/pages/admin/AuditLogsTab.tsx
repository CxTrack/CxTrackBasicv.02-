import { Search, User, Filter } from 'lucide-react';

export const AuditLogsTab = () => {
    const logs = [
        { id: 1, action: 'user.created', actor: 'admin@cxtrack.com', target: 'newuser@example.com', time: '10m ago' },
        { id: 2, action: 'settings.updated', actor: 'superadmin@cxtrack.com', target: 'Security Policy', time: '1h ago' },
        { id: 3, action: 'organization.suspended', actor: 'system', target: 'Org #1234', time: '2h ago' },
        { id: 4, action: 'invoice.voided', actor: 'billing@cxtrack.com', target: 'INV-2024-001', time: '1d ago' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h2>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                    />
                </div>
                <button className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Action</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actor</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Target</th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                    <User className="w-3 h-3 text-gray-400" />
                                    {log.actor}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {log.target}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-500">
                                    {log.time}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
