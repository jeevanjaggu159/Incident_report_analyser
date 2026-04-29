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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <span>📋</span> Analysis Results
      </h2>

      {/* Category Section */}
      <div className="mb-5 p-5 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-2xl border border-purple-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-400"></div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Incident Category</h3>
        <p className="text-xl font-bold text-purple-800">{analysis.category || "Uncategorized"}</p>
      </div>

      {/* Severity Section */}
      <div className="mb-6 p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Severity Level</h3>
        <div className="flex items-center">
          <SeverityBadge severity={analysis.severity} />
        </div>
      </div>

      {/* Root Cause Section */}
      <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🎯</span> Root Cause
        </h3>
        <p className="text-slate-700 text-[15px] leading-relaxed">{analysis.root_cause}</p>
      </div>

      {/* Contributing Factors Section */}
      <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>⚡</span> Contributing Factors
        </h3>
        <ul className="space-y-2">
          {analysis.contributing_factors && analysis.contributing_factors.length > 0 ? (
            analysis.contributing_factors.map((factor, index) => (
              <li key={index} className="flex items-start gap-4">
                <span className="text-yellow-500 font-bold flex-shrink-0 mt-0.5">•</span>
                <span className="text-slate-700 text-[15px]">{factor}</span>
              </li>
            ))
          ) : (
            <p className="text-slate-500 italic text-[15px]">No contributing factors identified</p>
          )}
        </ul>
      </div>

      {/* Prevention Measures Section */}
      <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-green-400"></div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>🛡️</span> Prevention Measures
        </h3>
        <ul className="space-y-2">
          {analysis.prevention_measures && analysis.prevention_measures.length > 0 ? (
            analysis.prevention_measures.map((measure, index) => (
              <li key={index} className="flex items-start gap-4">
                <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                <span className="text-slate-700 text-[15px]">{measure}</span>
              </li>
            ))
          ) : (
            <p className="text-slate-500 italic text-[15px]">No prevention measures recommended</p>
          )}
        </ul>
      </div>

      {/* Similar Incidents Section */}
      {similarIncidents && similarIncidents.length > 0 && (
        <div className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>🔗</span> Similar Past Incidents
          </h3>
          <p className="text-[15px] text-slate-600 leading-relaxed">
            This analysis was informed by <span className="font-bold text-blue-700">{similarIncidents.length}</span> similar incident(s) from your history.
            Review them for additional context and lessons learned.
          </p>
        </div>
      )}
    </div>
  )
}

export default AnalysisResult
