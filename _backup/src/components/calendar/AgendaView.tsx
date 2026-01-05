import React from 'react';
import { format, isSameDay, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { Calendar, Users, Phone, Video, MapPin } from 'lucide-react';

interface AgendaViewProps {
  events: any[];
  onEventClick: (event: any) => void;
}

export default function AgendaView({ events, onEventClick }: AgendaViewProps) {
  const groupedEvents = events.reduce((groups: any, event) => {
    const date = format(new Date(event.start_time), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort();

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No upcoming events
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your calendar is clear. Time to schedule something!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateString) => {
        const dateEvents = groupedEvents[dateString].sort((a: any, b: any) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );

        return (
          <div key={dateString} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getDateLabel(dateString)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {dateEvents.map((event: any) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left flex items-start space-x-4 group"
                >
                  <div
                    className="w-1 h-full rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />

                  <div className="w-24 flex-shrink-0 pt-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {format(new Date(event.start_time), 'h:mm a')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000)} min
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {event.title}
                      </h4>
                      <span className={`ml-4 px-2 py-1 text-xs rounded-full font-medium flex-shrink-0 ${
                        event.status === 'confirmed'
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : event.status === 'cancelled'
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {event.status}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {event.attendee_name && (
                        <p className="flex items-center">
                          <Users size={14} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{event.attendee_name}</span>
                        </p>
                      )}
                      {event.attendee_email && (
                        <p className="flex items-center">
                          <Phone size={14} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{event.attendee_email}</span>
                        </p>
                      )}
                      {event.location && (
                        <p className="flex items-center">
                          <MapPin size={14} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </p>
                      )}
                      {event.meeting_url && (
                        <p className="flex items-center">
                          <Video size={14} className="mr-2 flex-shrink-0" />
                          <span className="truncate">Video meeting</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${event.color}20`,
                          color: event.color
                        }}
                      >
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
