/**
 * Security Tab Component
 * Password, 2FA, and session management
 */

import React, { useState } from 'react';
import {
    Shield, Key, Smartphone, Monitor, Globe,
    AlertTriangle, Check, Lock, Trash2, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Session {
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
}

export const SecurityTab: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showEnable2FA, setShowEnable2FA] = useState(false);

    const sessions: Session[] = [
        { id: '1', device: 'Windows PC', browser: 'Chrome', location: 'New York, NY', lastActive: 'Active now', isCurrent: true },
        { id: '2', device: 'iPhone 14', browser: 'Safari', location: 'New York, NY', lastActive: '2 hours ago', isCurrent: false },
        { id: '3', device: 'MacBook Pro', browser: 'Firefox', location: 'Boston, MA', lastActive: '3 days ago', isCurrent: false },
    ];

    const handlePasswordChange = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        // Demo mode simulation
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleEnable2FA = () => {
        setTwoFactorEnabled(true);
        setShowEnable2FA(false);
        toast.success('Two-factor authentication enabled!');
    };

    const handleRevokeSession = (_sessionId: string) => {
        toast.success('Session revoked');
    };

    const handleRevokeAll = () => {
        toast.success('All other sessions revoked');
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Security Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your account security and active sessions
                </p>
            </div>

            {/* Password Change */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
                        <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                </div>

                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Password must contain:</p>
                        <ul className="space-y-1 text-xs text-gray-500">
                            <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                                <Check size={12} /> At least 8 characters
                            </li>
                            <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                                <Check size={12} /> One uppercase letter
                            </li>
                            <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                                <Check size={12} /> One number
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={handlePasswordChange}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                    >
                        Update Password
                    </button>
                </div>
            </div>

            {/* Two-Factor Auth */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                </div>

                {twoFactorEnabled ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                            <Check className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-200">Two-factor authentication is enabled</p>
                                <p className="text-sm text-green-600 dark:text-green-400">Your account is protected with 2FA</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setTwoFactorEnabled(false)}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
                        >
                            Disable
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                        </p>
                        <button
                            onClick={() => setShowEnable2FA(true)}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center gap-2 transition-colors"
                        >
                            <Shield className="w-5 h-5" />
                            Enable Two-Factor Auth
                        </button>
                    </div>
                )}

                {/* 2FA Setup Modal */}
                {showEnable2FA && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Enable Two-Factor Authentication
                            </h3>

                            <div className="space-y-4">
                                <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                    <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center">
                                        <span className="text-xs text-gray-400">QR Code Placeholder</span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                    Scan this QR code with your authenticator app
                                </p>

                                <input
                                    type="text"
                                    placeholder="Enter verification code"
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-center text-lg tracking-widest"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleEnable2FA}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors"
                                    >
                                        Verify & Enable
                                    </button>
                                    <button
                                        onClick={() => setShowEnable2FA(false)}
                                        className="px-4 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Sessions</h3>
                            <p className="text-sm text-gray-500">Devices currently logged in</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRevokeAll}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                        <LogOut size={14} />
                        Sign out all other sessions
                    </button>
                </div>

                <div className="space-y-3">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className="flex items-center justify-between p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    {session.device.includes('iPhone') ? (
                                        <Smartphone className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <Monitor className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {session.browser} on {session.device}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Globe size={12} />
                                        <span>{session.location}</span>
                                        <span>•</span>
                                        <span>{session.lastActive}</span>
                                    </div>
                                </div>
                            </div>
                            {session.isCurrent ? (
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                    Current
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleRevokeSession(session.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border-2 border-red-200 dark:border-red-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200">Danger Zone</h3>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="px-4 py-2 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors">
                    Delete Account
                </button>
            </div>
        </div>
    );
};

export default SecurityTab;
