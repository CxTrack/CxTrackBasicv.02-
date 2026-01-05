import React from 'react';
import { Clock } from 'lucide-react';

interface TimePickerButtonsProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
  label?: string;
}

export default function TimePickerButtons({
  selectedTime,
  onTimeChange,
  label = "Start Time *"
}: TimePickerButtonsProps) {

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00'
  ];

  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatTime24 = (time12: string) => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return time12;

    let [, hours, minutes, period] = match;
    let hour = parseInt(hours);

    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {label}
      </label>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {timeSlots.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => onTimeChange(formatTime(time))}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              formatTime24(selectedTime) === time
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      <div className="relative">
        <span className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">or enter custom time</span>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="time"
            value={formatTime24(selectedTime)}
            onChange={(e) => {
              const time24 = e.target.value;
              const formatted = formatTime(time24);
              onTimeChange(formatted);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
