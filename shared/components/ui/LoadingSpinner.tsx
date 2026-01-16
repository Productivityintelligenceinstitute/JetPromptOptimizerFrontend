import React from 'react';
import { cn } from '@/shared/lib/cn';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
};

export default function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
    return (
        <div className="flex items-center justify-center p-4">
            <div
                className={cn(
                    "animate-spin rounded-full border-gray-300 border-t-jet-blue",
                    sizeClasses[size],
                    className
                )}
            />
        </div>
    );
}
