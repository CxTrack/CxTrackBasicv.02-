import { format } from 'date-fns';
import {
  X, Clock, MapPin, Users, Calendar, Plus
} from 'lucide-react';
import { Card } from '@/components/theme/ThemeComponents';
import { useThemeStore } from '@/stores/themeStore';
import type { CalendarEvent } from '@/types/database.types';

interface AgendaPanelProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onScheduleEvent: () => void;
  onClose: () => void;
}

export default function AgendaPanel({
  selectedDate,
  events,
  onEventClick,
  onScheduleEvent,
  onClose
}: AgendaPanelProps) {
  const { theme } = useThemeStore();

  return (
    <Card className={`w-full lg:w-96 border-l ${theme === 'soft-modern' ? 'border-gray-200' : 'border-gray-200 dark:border-gray-700'} flex flex-col rounded-none`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today's Agenda
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={16} className="mr-2" />
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No events scheduled
            </p>
            <button
              onClick={onScheduleEvent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} className="inline mr-1" />
              Schedule Event
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                    <Clock size={14} className="mr-1" />
                    {format(new Date(event.start_time), 'h:mm a')}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${event.status === 'confirmed'
                    ? 'bg-green-500'
                    : event.status === 'cancelled'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                    }`} />
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {event.title}
                </h4>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {event.attendees && event.attendees.length > 0 && (
                    <p className="flex items-center">
                      <Users size={12} className="mr-1" />
                      {event.attendees[0].name}
                    </p>
                  )}
                  {event.location && (
                    <p className="flex items-center truncate">
                      <MapPin size={12} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  )}
                </div>

                <div className="mt-3">
                  <span className="px-2 py-1 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: `${event.color_code || '#6366f1'}20`,
                      color: event.color_code || '#6366f1'
                    }}
                  >
                    {event.event_type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`p-6 border-t ${theme === 'soft-modern' ? 'border-gray-200 bg-white/50' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Events Today</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.filter(e => e.status === 'confirmed').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Confirmed</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
