import React, { useState } from 'react';
import { X, Bell, BellOff, Volume2, VolumeX, Monitor, Eye, EyeOff, Keyboard, Layout } from 'lucide-react';
import { ChatSettings, DEFAULT_CHAT_SETTINGS } from '@/types/chat.types';

interface ChatSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ChatSettings;
    onSave: (settings: ChatSettings) => void;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
}) => {
    const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const handleReset = () => {
        setLocalSettings(DEFAULT_CHAT_SETTINGS);
    };

    const SettingToggle: React.FC<{
        label: string;
        description: string;
        icon: React.ReactNode;
        enabled: boolean;
        onChange: (value: boolean) => void;
    }> = ({ label, description, icon, enabled, onChange }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {icon}
                </div>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                </div>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`
          relative w-12 h-6 rounded-full transition-all duration-200
          ${enabled
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }
        `}
            >
                <span
                    className={`
            absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200
            ${enabled ? 'left-7' : 'left-1'}
          `}
                />
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chat Settings</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Settings */}
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                    {/* Notifications Section */}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Notifications</p>

                    <SettingToggle
                        label="Notifications"
                        description="Receive notifications for new messages"
                        icon={localSettings.notifications_enabled ? <Bell size={18} /> : <BellOff size={18} />}
                        enabled={localSettings.notifications_enabled}
                        onChange={(v) => setLocalSettings({ ...localSettings, notifications_enabled: v })}
                    />

                    <SettingToggle
                        label="Sound"
                        description="Play sound for new messages"
                        icon={localSettings.sound_enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        enabled={localSettings.sound_enabled}
                        onChange={(v) => setLocalSettings({ ...localSettings, sound_enabled: v })}
                    />

                    <SettingToggle
                        label="Desktop Notifications"
                        description="Show browser notifications"
                        icon={<Monitor size={18} />}
                        enabled={localSettings.desktop_notifications}
                        onChange={(v) => setLocalSettings({ ...localSettings, desktop_notifications: v })}
                    />

                    {/* Privacy Section */}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-6">Privacy</p>

                    <SettingToggle
                        label="Read Receipts"
                        description="Let others know when you've read their messages"
                        icon={localSettings.show_read_receipts ? <Eye size={18} /> : <EyeOff size={18} />}
                        enabled={localSettings.show_read_receipts}
                        onChange={(v) => setLocalSettings({ ...localSettings, show_read_receipts: v })}
                    />

                    <SettingToggle
                        label="Typing Indicators"
                        description="Show when you're typing"
                        icon={<Keyboard size={18} />}
                        enabled={localSettings.show_typing_indicators}
                        onChange={(v) => setLocalSettings({ ...localSettings, show_typing_indicators: v })}
                    />

                    {/* Display Section */}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-6">Display</p>

                    <SettingToggle
                        label="Compact Mode"
                        description="Show more messages with less spacing"
                        icon={<Layout size={18} />}
                        enabled={localSettings.compact_mode}
                        onChange={(v) => setLocalSettings({ ...localSettings, compact_mode: v })}
                    />

                    <SettingToggle
                        label="Enter to Send"
                        description="Press Enter to send, Shift+Enter for new line"
                        icon={<Keyboard size={18} />}
                        enabled={localSettings.enter_to_send}
                        onChange={(v) => setLocalSettings({ ...localSettings, enter_to_send: v })}
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <button
                        onClick={handleReset}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                    >
                        Reset to Defaults
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatSettingsModal;
