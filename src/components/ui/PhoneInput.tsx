import { forwardRef } from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const unformatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits ? `+1${digits}` : '';
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, className = '', ...props }, ref) => {
    const displayValue = value.startsWith('+1')
      ? formatPhoneNumber(value.slice(2))
      : formatPhoneNumber(value.replace(/\D/g, ''));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatPhoneNumber(e.target.value);
      const newValue = unformatPhoneNumber(formattedValue);

      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);
    };

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400 text-sm font-medium">
          +1
        </div>
        <input
          ref={ref}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          className={`w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          placeholder="(555) 123-4567"
          maxLength={14}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
