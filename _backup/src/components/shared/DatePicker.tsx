import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  label?: string;
  minDate?: Date;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  label = 'Select a day',
  minDate,
  required = false,
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  const handleDateSelect = (date: Date) => {
    if (minDate && date < minDate) return;
    onDateChange(date);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && '*'}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl hover:border-primary-500 dark:hover:border-primary-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {format(selectedDate, 'dd.MM.yyyy')}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 max-w-sm">

          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>

            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-3">
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="aspect-square" />
            ))}

            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const isDisabled = minDate && day < minDate;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    aspect-square rounded-lg text-xs font-medium transition-all
                    ${isSelected
                      ? 'bg-primary-600 text-white shadow-md'
                      : isToday
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-2 border-primary-300 dark:border-primary-700'
                      : isDisabled
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                handleDateSelect(new Date());
              }}
              className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
