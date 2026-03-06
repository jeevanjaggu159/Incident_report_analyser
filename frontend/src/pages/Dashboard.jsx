import React, { useState } from 'react'
import IncidentForm from '../components/IncidentForm'
import AnalysisResult from '../components/AnalysisResult'
import ReportHistory from '../components/ReportHistory'
import Analytics from '../components/Analytics'
import QAChat from '../components/QAChat'
import { analyzeIncident } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * Dashboard Page
 * Main page with all components
 */
const Dashboard = () => {
  const [analysis, setAnalysis] = useState(null)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚗 Incident Report Analyzer
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                AI-Powered Analysis for Transportation Safety
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm">Transportation Domain</p>
              <p className="text-gray-600 text-sm">Powered by OpenAI & FAISS</p>
            </div>
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
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-3 font-semibold transition border-b-2 ${activeTab === 'analyze'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-blue-500'
              }`}
          >
            📊 Analyze
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-semibold transition border-b-2 ${activeTab === 'history'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-blue-500'
              }`}
          >
            📚 History
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-semibold transition border-b-2 ${activeTab === 'analytics'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-blue-500'
              }`}
          >
            📈 Analytics
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-3 font-semibold transition border-b-2 ${activeTab === 'chat'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-blue-500'
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
            {!loading && analysis && (
              <div id="results">
                <AnalysisResult
                  analysis={analysis}
                  loading={false}
                  similarIncidents={similarIncidents}
                />
              </div>
            )}

            {/* Empty State */}
            {!loading && !analysis && !error && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-gray-500 text-lg mb-2">No analysis yet</p>
                <p className="text-gray-400">
                  Submit an incident report above to get started
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
      <footer className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2026 Incident Report Analyzer. Gen AI Application for Transportation Safety.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
