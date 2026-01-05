import React, { useState, useEffect } from 'react';
import {
  Calendar, Video, ExternalLink, RefreshCw, Palette
} from 'lucide-react';
import { calComService } from '@/services/calcom.service';
import { useOrganizationStore } from '@/stores/organizationStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function CalendarSettings() {
  const { currentOrganization } = useOrganizationStore();
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [settings, setSettings] = useState({
    calcom_api_key: '',
    calcom_connected: false,
    auto_sync: true,
    sync_interval: 15,
    default_view: 'week',
    week_start_day: 1,
    time_format: '12h',
    show_weekends: true,
    show_agenda_panel: true,
    event_colors: {
      appointment: '#6366f1',
      meeting: '#10b981',
      call: '#f59e0b',
      task: '#8b5cf6',
      reminder: '#ec4899'
    }
  });

  useEffect(() => {
    loadSettings();
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('calcom_settings')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (data && !error) {
        setSettings(prev => ({
          ...prev,
          calcom_api_key: data.api_key || '',
          calcom_connected: !!data.api_key,
          auto_sync: data.auto_sync,
          sync_interval: data.sync_interval,
        }));
      }
    } catch (error) {
      console.error('Failed to load calendar settings:', error);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.calcom_api_key) {
      toast.error('Please enter an API key');
      return;
    }

    setTesting(true);
    try {
      calComService.setApiKey(settings.calcom_api_key);
      await calComService.getEventTypes();
      setSettings({ ...settings, calcom_connected: true });
      toast.success('Connection successful!');
    } catch (error) {
      toast.error('Connection failed. Please check your API key.');
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await calComService.syncBookings();
      toast.success('Sync completed successfully!');
    } catch (error) {
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const saveSettings = async () => {
    if (!currentOrganization?.id) return;

    try {
      await supabase.from('calcom_settings').upsert({
        organization_id: currentOrganization.id,
        api_key: settings.calcom_api_key,
        auto_sync: settings.auto_sync,
        sync_interval: settings.sync_interval,
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Video size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
              Cal.com Integration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Connect your Cal.com account to sync bookings
            </p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            settings.calcom_connected
              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {settings.calcom_connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={settings.calcom_api_key}
              onChange={(e) => setSettings({ ...settings, calcom_api_key: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="cal_live_..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Get your API key from{' '}
              <a
                href="https://app.cal.com/settings/developer/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
              >
                Cal.com Settings
                <ExternalLink size={12} className="ml-1" />
              </a>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleTestConnection}
              disabled={!settings.calcom_api_key || testing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            {settings.calcom_connected && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}

            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Save Settings
            </button>
          </div>

          {settings.calcom_connected && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.auto_sync}
                  onChange={(e) => setSettings({ ...settings, auto_sync: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Automatically sync bookings every{' '}
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.sync_interval}
                    onChange={(e) => setSettings({ ...settings, sync_interval: parseInt(e.target.value) || 15 })}
                    className="w-16 px-2 py-1 mx-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center"
                  />
                  minutes
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Calendar size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
          View Preferences
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default View
            </label>
            <select
              value={settings.default_view}
              onChange={(e) => setSettings({ ...settings, default_view: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="agenda">Agenda</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Week Starts On
            </label>
            <select
              value={settings.week_start_day}
              onChange={(e) => setSettings({ ...settings, week_start_day: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Format
            </label>
            <select
              value={settings.time_format}
              onChange={(e) => setSettings({ ...settings, time_format: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="12h">12-hour (9:00 AM)</option>
              <option value="24h">24-hour (09:00)</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_weekends"
              checked={settings.show_weekends}
              onChange={(e) => setSettings({ ...settings, show_weekends: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="show_weekends" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Weekends
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Palette size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
          Event Colors
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(settings.event_colors).map(([type, color]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {type}
              </span>
              <input
                type="color"
                value={color}
                onChange={(e) => setSettings({
                  ...settings,
                  event_colors: { ...settings.event_colors, [type]: e.target.value }
                })}
                className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
