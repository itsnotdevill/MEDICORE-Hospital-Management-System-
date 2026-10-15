import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label = 'Loading...',
}) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-[#1e3a5f]`} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
};

interface PageLoaderProps {
  label?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ label = 'Loading...' }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <LoadingSpinner size="lg" label={label} />
  </div>
);
