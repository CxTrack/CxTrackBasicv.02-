/**
 * Notifications Tab Component
 * Email and push notification preferences
 */

import React, { useState } from 'react';
import {
    Bell, Mail, Smartphone, Volume2, MessageSquare,
    Users, Calendar, CheckCircle, AlertTriangle, Zap
} from 'lucide-react';
import { DEMO_MODE } from '@/config/demo.config';
import toast from 'react-hot-toast';

interface NotificationSettings {
    // Email
    email_new_leads: boolean;
    email_deal_changes: boolean;
    email_task_reminders: boolean;
    email_team_mentions: boolean;
    email_weekly_summary: boolean;
    email_marketing: boolean;

    // Push
    push_desktop: boolean;
    push_mobile: boolean;
    push_sound: boolean;

    // In-App
    inapp_messages: boolean;
    inapp_updates: boolean;
}

const DEMO_NOTIFICATIONS_KEY = 'cxtrack_demo_notifications';

export const NotificationsTab: React.FC = () => {
    const [settings, setSettings] = useState<NotificationSettings>(() => {
        if (DEMO_MODE) {
            const saved = localStorage.getItem(DEMO_NOTIFICATIONS_KEY);
            if (saved) return JSON.parse(saved);
        }
        return {
            email_new_leads: true,
            email_deal_changes: true,
            email_task_reminders: true,
            email_team_mentions: true,
            email_weekly_summary: true,
            email_marketing: false,
            push_desktop: true,
            push_mobile: true,
            push_sound: true,
            inapp_messages: true,
            inapp_updates: true,
        };
    });

    const handleToggle = (key: keyof NotificationSettings) => {
        const updated = { ...settings, [key]: !settings[key] };
        setSettings(updated);
        if (DEMO_MODE) {
            localStorage.setItem(DEMO_NOTIFICATIONS_KEY, JSON.stringify(updated));
        }
        toast.success('Preference updated');
    };

    const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={onChange}
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    );

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Notification Preferences
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Control how and when you receive notifications
                </p>
            </div>

            {/* Email Notifications */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                </div>

                <div className="space-y-1">
                    {[
                        { key: 'email_new_leads', label: 'New leads assigned to me', description: 'Get notified when a lead is assigned to you', icon: Users },
                        { key: 'email_deal_changes', label: 'Deal status changes', description: 'Updates when deals move through your pipeline', icon: Zap },
                        { key: 'email_task_reminders', label: 'Task reminders', description: 'Reminders for upcoming and overdue tasks', icon: CheckCircle },
                        { key: 'email_team_mentions', label: 'Team mentions', description: 'When someone mentions you in notes or comments', icon: MessageSquare },
                        { key: 'email_weekly_summary', label: 'Weekly summary', description: 'Weekly digest of your CRM activity', icon: Calendar },
                        { key: 'email_marketing', label: 'Product updates & tips', description: 'News about new features and best practices', icon: Bell },
                    ].map(item => (
                        <div
                            key={item.key}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                                </div>
                            </div>
                            <ToggleSwitch
                                checked={settings[item.key as keyof NotificationSettings]}
                                onChange={() => handleToggle(item.key as keyof NotificationSettings)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Push Notifications */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Real-time alerts on your devices</p>
                    </div>
                </div>

                <div className="space-y-1">
                    {[
                        { key: 'push_desktop', label: 'Desktop notifications', description: 'Show notifications on your desktop browser', icon: Bell },
                        { key: 'push_mobile', label: 'Mobile notifications', description: 'Receive push notifications on mobile devices', icon: Smartphone },
                        { key: 'push_sound', label: 'Sound alerts', description: 'Play sound when notifications arrive', icon: Volume2 },
                    ].map(item => (
                        <div
                            key={item.key}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                                </div>
                            </div>
                            <ToggleSwitch
                                checked={settings[item.key as keyof NotificationSettings]}
                                onChange={() => handleToggle(item.key as keyof NotificationSettings)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quiet Hours</h3>
                        <p className="text-sm text-gray-500">Pause notifications during specific times</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
                        <input
                            type="time"
                            defaultValue="22:00"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
                        <input
                            type="time"
                            defaultValue="08:00"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationsTab;
