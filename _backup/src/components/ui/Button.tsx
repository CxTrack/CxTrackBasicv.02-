import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300',
    ghost: 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
};
