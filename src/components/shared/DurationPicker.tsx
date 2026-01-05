import React from 'react';

interface DurationPickerProps {
  duration: number;
  onDurationChange: (minutes: number) => void;
  label?: string;
  required?: boolean;
}

export default function DurationPicker({
  duration,
  onDurationChange,
  label = "Duration",
  required = true
}: DurationPickerProps) {

  const durationOptions = [
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '1 hr', minutes: 60 },
    { label: '1.5 hr', minutes: 90 },
    { label: '2 hr', minutes: 120 },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && '*'}
      </label>

      <div className="grid grid-cols-6 gap-2">
        {durationOptions.map((option) => (
          <button
            key={option.minutes}
            type="button"
            onClick={() => onDurationChange(option.minutes)}
            className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              duration === option.minutes
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
