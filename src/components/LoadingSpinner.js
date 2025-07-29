import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            {/* Simple Spinner */}
            <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute top-2 left-2 w-12 h-12 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute top-3 left-3 w-10 h-10 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>

            {/* Message */}
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {message}
                </h3>
                <div className="loading-dots text-gray-500">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            {/* Progress indicator */}
            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
            </div>
        </div>
    );
};

export default LoadingSpinner; 