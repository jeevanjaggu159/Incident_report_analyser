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
          <label className="block text-xl font-bold text-slate-800 mb-1">
            Incident Report
          </label>
          <p className="text-slate-500 font-medium mb-4">
            Describe the incident in detail to get AI-powered analysis.
          </p>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={reportText}
            onChange={handleTextChange}
            placeholder="Enter incident report details... (Minimum 10 characters, Maximum 5000)"
            disabled={isLoading}
            className={`w-full h-48 p-5 border rounded-2xl focus:outline-none focus:ring-4 focus:border-transparent transition-all resize-none shadow-sm ${error
              ? 'border-red-300 bg-red-50 focus:ring-red-500/20'
              : 'border-slate-200 bg-white focus:ring-blue-500/20 focus:border-blue-500'
              } ${isLoading ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}`}
          />

          {/* Character Counter */}
          <div
            className={`absolute bottom-4 right-4 text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm ${charCount > MAX_CHARS * 0.9
              ? 'bg-orange-100/80 text-orange-700'
              : charCount > 0
                ? 'bg-green-100/80 text-green-700'
                : 'text-slate-400'
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
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium flex items-center gap-2">
            <span>ℹ️</span> Add {MIN_CHARS - charCount} more characters to enable analysis
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || charCount < MIN_CHARS}
          className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 transform ${isLoading || charCount < MIN_CHARS
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span>
              Analyzing with AI...
            </span>
          ) : (
            '✨ Analyze Incident'
          )}
        </button>
      </div>
    </form>
  )
}

export default IncidentForm
