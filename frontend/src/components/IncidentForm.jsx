import React, { useState } from 'react'

/**
 * IncidentForm Component
 * Allows users to submit incident reports for analysis
 */
const IncidentForm = ({ onSubmit, isLoading }) => {
  const [reportText, setReportText] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [error, setError] = useState('')

  const MIN_CHARS = 10
  const MAX_CHARS = 5000

  const handleTextChange = (e) => {
    const text = e.target.value
    const length = text.length

    if (length <= MAX_CHARS) {
      setReportText(text)
      setCharCount(length)
      setError('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!reportText.trim()) {
      setError('Please enter an incident report')
      return
    }

    if (reportText.length < MIN_CHARS) {
      setError(`Report must be at least ${MIN_CHARS} characters long`)
      return
    }

    setError('')
    onSubmit(reportText)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4">
        {/* Form Title */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">
             Incident Report
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Describe the incident in detail to get AI-powered analysis
          </p>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={reportText}
            onChange={handleTextChange}
            placeholder="Enter incident report details... (Minimum 10 characters, Maximum 5000)"
            disabled={isLoading}
            className={`w-full h-48 p-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none ${error
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
            } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          />

          {/* Character Counter */}
          <div
            className={`absolute bottom-3 right-3 text-sm font-medium ${ charCount > MAX_CHARS * 0.9
                ? 'text-orange-600'
                : charCount > 0
                ? 'text-green-600'
                : 'text-gray-400'
            }`}
          >
            {charCount} / {MAX_CHARS}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
             {error}
          </div>
        )}

        {/* Character Count Info */}
        {charCount > 0 && charCount < MIN_CHARS && (
          <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-sm">
            ℹ Add {MIN_CHARS - charCount} more characters to enable analysis
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || charCount < MIN_CHARS}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition duration-200 ${
            isLoading || charCount < MIN_CHARS
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2"></span>
              Analyzing...
            </span>
          ) : (
            ' Analyze Incident'
          )}
        </button>
      </div>
    </form>
  )
}

export default IncidentForm
