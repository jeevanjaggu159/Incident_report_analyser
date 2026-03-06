import React from 'react'

/**
 * LoadingSpinner Component
 * Displays a loading indicator
 */
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin"></div>
        <div className="absolute inset-1 bg-white rounded-full"></div>
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  )
}

export default LoadingSpinner
