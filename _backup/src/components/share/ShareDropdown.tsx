import React, { useState, useRef, useEffect } from 'react';
import { Mail, Link2, Download, MessageSquare, ChevronDown } from 'lucide-react';

export type ShareOption = 'email' | 'link' | 'pdf' | 'sms';

interface ShareDropdownProps {
  onSelect: (option: ShareOption) => void;
  disabled?: boolean;
  buttonText?: string;
  variant?: 'primary' | 'secondary';
}

export default function ShareDropdown({
  onSelect,
  disabled = false,
  buttonText = 'Share',
  variant = 'primary',
}: ShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (option: ShareOption) => {
    onSelect(option);
    setIsOpen(false);
  };

  const baseButtonClasses = 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const primaryButtonClasses = 'bg-blue-600 hover:bg-blue-700 text-white';
  const secondaryButtonClasses = 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${baseButtonClasses} ${variant === 'primary' ? primaryButtonClasses : secondaryButtonClasses}`}
      >
        {buttonText}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <button
            onClick={() => handleSelect('email')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Send via Email
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Email to customer
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelect('link')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Link2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Get Shareable Link
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Copy link to clipboard
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelect('pdf')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Download className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Download as PDF
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Save to your device
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelect('sms')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Send via SMS
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Text to customer
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
