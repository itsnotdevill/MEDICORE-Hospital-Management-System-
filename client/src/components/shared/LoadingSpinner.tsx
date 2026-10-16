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
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <span className="absolute w-8 h-8 rounded-full bg-cyan-100/60 animate-ping" />
        <Loader2 className={`${sizes[size]} animate-spin text-[#19B8C9] relative z-10`} />
      </div>
      {label && <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide">{label}</p>}
    </div>
  );
};

interface PageLoaderProps {
  label?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ label = 'Loading operational clinical data...' }) => (
  <div className="min-h-[360px] flex items-center justify-center p-8">
    <LoadingSpinner size="lg" label={label} />
  </div>
);

