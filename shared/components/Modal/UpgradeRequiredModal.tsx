"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/navigation';

interface UpgradeRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function UpgradeRequiredModal({ 
  isOpen, 
  onClose, 
  featureName = "this feature" 
}: UpgradeRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push(APP_ROUTES.pricing);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full">
            <svg 
              className="w-6 h-6 text-orange-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Upgrade Required
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            You don't have permission to use <span className="font-medium text-gray-900">{featureName}</span> with your current plan. 
            Upgrade to a higher plan to unlock this feature and access advanced optimization capabilities.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpgrade}
              className="flex-1 bg-jet-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-jet-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-jet-blue focus:ring-offset-2"
            >
              View Plans
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

