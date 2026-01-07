"use client";

import React from 'react';

interface SharePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function SharePromptModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  isLoading = false
}: SharePromptModalProps) {
  if (!isOpen) return null;

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
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-jet-blue/10 rounded-full">
            <svg 
              className="w-6 h-6 text-jet-blue" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Share to Library
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to share this response in the library? This will make your prompt visible to all users.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-jet-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-jet-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-jet-blue focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sharing...
                </>
              ) : (
                'Yes, Share It'
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


