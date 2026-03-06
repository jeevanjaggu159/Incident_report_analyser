import React from 'react'
import SeverityBadge from './SeverityBadge'
import LoadingSpinner from './LoadingSpinner'

/**
 * AnalysisResult Component
 * Displays the structured analysis output
 */
const AnalysisResult = ({ analysis, loading = false, similarIncidents = [] }) => {
  if (loading) {
    return <LoadingSpinner message="Analyzing incident..." />
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Analysis Results</h2>

      {/* Category Section */}
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Incident Category</h3>
        <p className="text-lg font-bold text-purple-700">{analysis.category || "Uncategorized"}</p>
      </div>

      {/* Severity Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Severity Level</h3>
        <div className="flex items-center">
          <SeverityBadge severity={analysis.severity} />
        </div>
      </div>

      {/* Root Cause Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-red-500">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">🎯 Root Cause</h3>
        <p className="text-gray-800 leading-relaxed">{analysis.root_cause}</p>
      </div>

      {/* Contributing Factors Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-500">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">⚡ Contributing Factors</h3>
        <ul className="space-y-2">
          {analysis.contributing_factors && analysis.contributing_factors.length > 0 ? (
            analysis.contributing_factors.map((factor, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold flex-shrink-0 mt-1">•</span>
                <span className="text-gray-800">{factor}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-600 italic">No contributing factors identified</p>
          )}
        </ul>
      </div>

      {/* Prevention Measures Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">🛡️ Prevention Measures</h3>
        <ul className="space-y-2">
          {analysis.prevention_measures && analysis.prevention_measures.length > 0 ? (
            analysis.prevention_measures.map((measure, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-green-600 font-bold flex-shrink-0 mt-1">✓</span>
                <span className="text-gray-800">{measure}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-600 italic">No prevention measures recommended</p>
          )}
        </ul>
      </div>

      {/* Similar Incidents Section */}
      {similarIncidents && similarIncidents.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">🔗 Similar Past Incidents</h3>
          <p className="text-sm text-gray-700">
            This analysis was informed by {similarIncidents.length} similar incident(s) from your history.
            Review them for additional context and lessons learned.
          </p>
        </div>
      )}
    </div>
  )
}

export default AnalysisResult
