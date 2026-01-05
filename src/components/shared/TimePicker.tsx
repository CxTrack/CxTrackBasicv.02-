import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
  label?: string;
  excludeTimes?: string[];
  required?: boolean;
}

export default function TimePicker({
  selectedTime,
  onTimeChange,
  label = 'Start Time',
  excludeTimes = [],
  required = true,
}: TimePickerProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualHour, setManualHour] = useState('09');
  const [manualMinute, setManualMinute] = useState('00');
  const [manualPeriod, setManualPeriod] = useState<'AM' | 'PM'>('AM');

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  ];

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  useEffect(() => {
    if (!selectedTime && required) {
      const currentTime = getCurrentTime();
      onTimeChange(currentTime);
    }
  }, [selectedTime, onTimeChange, required]);

  const isTimeDisabled = (time: string) => {
    return excludeTimes.includes(time);
  };

  const handleManualTimeChange = (hour: string, minute: string, period: 'AM' | 'PM') => {
    setManualHour(hour);
    setManualMinute(minute);
    setManualPeriod(period);
    onTimeChange(`${hour}:${minute} ${period}`);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && '*'}
      </label>

      <div className="grid grid-cols-4 gap-2">
        {timeSlots.map((time) => {
          const isSelected = selectedTime === time;
          const isDisabled = isTimeDisabled(time);
          const isCurrent = time === getCurrentTime();

          return (
            <button
              key={time}
              type="button"
              onClick={() => !isDisabled && onTimeChange(time)}
              disabled={isDisabled}
              className={`
                px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : isDisabled
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : isCurrent
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-2 border-primary-300 dark:border-primary-700'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }
              `}
            >
              {time}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">or choose time</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white font-medium">
              {selectedTime || 'Select time'}
            </span>
          </div>
          <ChevronDown size={18} className={`text-gray-500 dark:text-gray-400 transition-transform ${showManualInput ? 'rotate-180' : ''}`} />
        </button>

        {showManualInput && (
          <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Hour</label>
                <select
                  value={manualHour}
                  onChange={(e) => handleManualTimeChange(e.target.value, manualMinute, manualPeriod)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {[...Array(12)].map((_, i) => {
                    const hour = (i + 1).toString().padStart(2, '0');
                    return <option key={hour} value={hour}>{hour}</option>;
                  })}
                </select>
              </div>

              <div className="flex items-center justify-center pt-6">
                <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
              </div>

              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Min</label>
                <select
                  value={manualMinute}
                  onChange={(e) => handleManualTimeChange(manualHour, e.target.value, manualPeriod)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {['00', '15', '30', '45'].map(min => (
                    <option key={min} value={min}>{min}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Period</label>
                <div className="flex gap-1">
                  {(['AM', 'PM'] as const).map(period => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => handleManualTimeChange(manualHour, manualMinute, period)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        manualPeriod === period
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowManualInput(false)}
              className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
