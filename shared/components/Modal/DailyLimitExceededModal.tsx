"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/navigation';

interface DailyLimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function DailyLimitExceededModal({ 
  isOpen, 
  onClose, 
  featureName = "this feature" 
}: DailyLimitExceededModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push(APP_ROUTES.pricing);
  };

  const handleContactAdmin = () => {
    // Close modal and scroll to contact section or open email
    onClose();
    // You can implement contact functionality here
    // For example: router.push('/contact') or window.location.href = 'mailto:support@example.com'
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
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg 
              className="w-6 h-6 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Daily Limit Reached
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            You've reached your daily query limit for <span className="font-medium text-gray-900">{featureName}</span>. 
            Your limit will reset tomorrow, or you can upgrade your plan for higher limits and unlimited access to more features.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-jet-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-jet-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-jet-blue focus:ring-offset-2"
            >
              Upgrade Plan
            </button>
            <button
              onClick={handleContactAdmin}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              Contact Admin
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 px-4 py-2 rounded-lg font-medium hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

