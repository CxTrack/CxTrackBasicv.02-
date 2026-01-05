import React from 'react';
import { format, startOfWeek, addDays, addHours, isSameDay, isToday } from 'date-fns';

interface WeekViewProps {
  currentDate: Date;
  events: any[];
  onEventClick: (event: any) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

export default function WeekView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, day) && eventDate.getHours() === hour;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <div className="p-3 border-r border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">Time</span>
        </div>
        {days.map((day, index) => (
          <div
            key={index}
            className={`p-3 text-center border-r border-gray-200 dark:border-gray-700 ${
              isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase">
              {format(day, 'EEE')}
            </div>
            <div className={`text-lg font-semibold mt-1 ${
              isToday(day)
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 text-right border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {format(addHours(new Date().setHours(hour, 0, 0, 0), 0), 'h:mm a')}
              </span>
            </div>

            {days.map((day, dayIndex) => {
              const dayEvents = getEventsForDayAndHour(day, hour);

              return (
                <button
                  key={dayIndex}
                  onClick={() => onTimeSlotClick(day, hour)}
                  className="p-2 border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors min-h-[80px] relative group"
                >
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className="w-full p-2 rounded text-left text-xs mb-1 hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: `${event.color}20`,
                        borderLeft: `3px solid ${event.color}`
                      }}
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {event.title}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 truncate">
                        {format(new Date(event.start_time), 'h:mm a')}
                      </p>
                    </button>
                  ))}

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-xs text-gray-400">+</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
