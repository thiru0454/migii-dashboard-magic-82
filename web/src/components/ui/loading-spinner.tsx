
import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  
  const colorClass = color || 'text-primary';
  
  return (
    <div className="flex justify-center items-center">
      <div className={`loader ${sizeClasses[size]} ${colorClass}`} role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};
