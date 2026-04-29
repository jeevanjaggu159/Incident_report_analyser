import React, { useState } from 'react'
import IncidentForm from '../components/IncidentForm'
import AnalysisResult from '../components/AnalysisResult'
import ReportHistory from '../components/ReportHistory'
import Analytics from '../components/Analytics'
import QAChat from '../components/QAChat'
import { analyzeIncident } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { generatePDF } from '../utils/pdfExport'

/**
 * Dashboard Page
 * Main page with all components
 */
const Dashboard = () => {
  const [analysis, setAnalysis] = useState(null)
  const [currentIncident, setCurrentIncident] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const [similarIncidents, setSimilarIncidents] = useState([])
  const [activeTab, setActiveTab] = useState('analyze')

  const handleAnalyzeSubmit = async (reportText) => {
    try {
      setLoading(true)
      setError('')

      const result = await analyzeIncident(reportText)

      setAnalysis(result.analysis)
      setCurrentIncident(result)
      setSimilarIncidents(result.similar_incidents || [])

      // Trigger history refresh
      setHistoryRefresh(prev => prev + 1)

      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('results')
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } catch (err) {
      // Check if it's a quota/rate limit error
      const errorDetail = err.detail || err.message || 'Failed to analyze incident'
      const isQuotaError = errorDetail && typeof errorDetail === 'object' && 'error' in errorDetail

      if (isQuotaError) {
        setError(
          `${errorDetail.error}\n\n💡 Tip: ${errorDetail.suggestion || 'Please upgrade your API plan'}`
        )
      } else if (typeof errorDetail === 'object') {
        // Handle structured error responses
        setError(errorDetail.error || JSON.stringify(errorDetail))
      } else {
        setError(errorDetail)
      }
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="block hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                🚗 Incident Report Analyzer
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                AI-Powered Analysis for Transportation Safety
              </p>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p className="font-semibold">⚠️ Error</p>
            <p className="mt-2 whitespace-pre-wrap">{error}</p>
            {error.includes('quota') && (
              <a
                href="https://platform.openai.com/account/billing/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                🔗 Check OpenAI Billing
              </a>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/50 p-1.5 rounded-2xl w-fit shadow-sm border border-slate-100">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${activeTab === 'analyze'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
          >
            📊 Analyze
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
          >
            📚 History
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
          >
            📈 Analytics
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
          >
            🤖 Ask AI
          </button>
        </div>

        {/* Content Areas */}
        {activeTab === 'analyze' && (
          <div>
            <IncidentForm
              onSubmit={handleAnalyzeSubmit}
              isLoading={loading}
            />

            {/* Loading State */}
            {loading && (
              <LoadingSpinner message="Analyzing incident with AI..." />
            )}

            {/* Results Section */}
            {!loading && analysis && currentIncident && (
              <div id="results">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                    Incident Report <span className="text-slate-400 font-mono text-xl">#{currentIncident.id}</span>
                  </h2>
                  <button
                    onClick={() => generatePDF(currentIncident)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors shadow-sm"
                  >
                    <span>📄</span> Download PDF
                  </button>
                </div>

                <AnalysisResult
                  analysis={analysis}
                  loading={false}
                  similarIncidents={similarIncidents}
                />
              </div>
            )}

            {/* Empty State */}
            {!loading && !analysis && !error && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-slate-800 font-semibold text-lg mb-2">No analysis yet</p>
                <p className="text-slate-500">
                  Submit an incident report above to receive an AI-powered breakdown
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <ReportHistory refreshTrigger={historyRefresh} />
        )}

        {activeTab === 'analytics' && (
          <Analytics />
        )}

        {activeTab === 'chat' && (
          <QAChat />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm font-medium tracking-wide">
          <p>
            © 2026 Incident Report Analyzer. Gen AI Application for Transportation Safety.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
