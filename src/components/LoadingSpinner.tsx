import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full gap-4">
      <div
        className={`
          ${sizeClasses[size]}
          border-primary-200 border-t-primary-600 rounded-full animate-spin
        `}
      />
      {message && (
        <p className="text-sm text-gray-500 animate-pulse">{message}</p>
      )}
    </div>
  );
};

interface PageLoaderProps {
  message?: string;
}

export const PageLoader = ({ message = 'Consulting the cosmos...' }: PageLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full">
      <LoadingSpinner message={message} size="lg" />
    </div>
  );
};