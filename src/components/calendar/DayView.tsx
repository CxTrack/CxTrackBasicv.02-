import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Clock, MapPin, Users, Video } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  events: any[];
  onEventClick: (event: any) => void;
  onTimeSlotClick: (hour: number) => void;
}

export default function DayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, currentDate) && eventDate.getHours() === hour;
    }).sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  };

  const getDayEvents = () => {
    return events.filter(event =>
      isSameDay(new Date(event.start_time), currentDate)
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        {getDayEvents().length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {getDayEvents().length} event{getDayEvents().length !== 1 ? 's' : ''} scheduled
          </p>
        )}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          const isCurrentHour = new Date().getHours() === hour && isSameDay(new Date(), currentDate);

          return (
            <div
              key={hour}
              className={`flex border-b border-gray-200 dark:border-gray-700 ${
                isCurrentHour ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className="w-24 flex-shrink-0 p-4 text-right border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <span className={`text-sm font-medium ${
                  isCurrentHour
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {format(new Date().setHours(hour, 0), 'h:mm a')}
                </span>
              </div>

              <button
                onClick={() => onTimeSlotClick(hour)}
                className="flex-1 p-4 min-h-[100px] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group relative"
              >
                {hourEvents.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-xs text-gray-400">Click to add event</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hourEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className="w-full p-4 rounded-lg hover:shadow-md transition-all text-left"
                        style={{
                          backgroundColor: `${event.color}10`,
                          borderLeft: `4px solid ${event.color}`
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {event.title}
                            </h4>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Clock size={14} className="mr-1" />
                              {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            event.status === 'confirmed'
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                              : event.status === 'cancelled'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {event.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {event.attendee_name && (
                            <p className="flex items-center">
                              <Users size={14} className="mr-2" />
                              {event.attendee_name}
                            </p>
                          )}
                          {event.location && (
                            <p className="flex items-center">
                              <MapPin size={14} className="mr-2" />
                              {event.location}
                            </p>
                          )}
                          {event.meeting_url && (
                            <p className="flex items-center">
                              <Video size={14} className="mr-2" />
                              Video meeting
                            </p>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
