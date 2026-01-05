import React from 'react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const CalendarPage: React.FC = () => {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your appointments and schedule
          </p>
        </div>
        <Button icon={<Plus size={18} />}>New Event</Button>
      </div>

      {/* Calendar Placeholder - Will implement react-big-calendar */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon size={32} className="text-indigo-600 dark:text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Calendar View
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your calendar events will appear here
            </p>
            <Button icon={<Plus size={18} />}>Schedule Appointment</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
