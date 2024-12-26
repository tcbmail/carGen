import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  isLoading?: boolean;
  error?: string;
}

export default function LoadingSelect({
  label,
  isLoading,
  error,
  children,
  ...props
}: LoadingSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'text-gray-400' : ''}`}
        >
          {children}
        </select>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}