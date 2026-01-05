import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select option',
  required = false,
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
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
          {selectedOption?.icon && (
            <div className={selectedOption.color || 'text-gray-500'}>
              {selectedOption.icon}
            </div>
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl py-2 max-h-64 overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                  ${isSelected
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {option.icon && (
                    <div className={option.color || 'text-gray-500'}>
                      {option.icon}
                    </div>
                  )}
                  <span className="text-sm font-medium">{option.label}</span>
                </div>

                {isSelected && (
                  <Check size={16} className="text-primary-600 dark:text-primary-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
