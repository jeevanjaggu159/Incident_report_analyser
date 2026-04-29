import React, { useState, useEffect } from 'react'
import { getHistory, getIncident } from '../services/api'
import SeverityBadge from './SeverityBadge'
import LoadingSpinner from './LoadingSpinner'
import AnalysisResult from './AnalysisResult'
import { formatDistanceToNow } from 'date-fns'
import { generatePDF } from '../utils/pdfExport'

/**
 * ReportHistory Component
 * Displays history of analyzed incidents
 */
const ReportHistory = ({ refreshTrigger }) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [searchDateInput, setSearchDateInput] = useState('')

  const [selectedIncident, setSelectedIncident] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const handleRowClick = async (id) => {
    try {
      setLoadingDetails(true)
      const data = await getIncident(id)
      setSelectedIncident(data)
    } catch (err) {
      console.error('Failed to load incident details', err)
      alert('Failed to load incident details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeModal = () => {
    setSelectedIncident(null)
  }

  const exportToCSV = () => {
    if (history.length === 0) return

    const headers = ['ID', 'Category', 'Location', 'Incident Date', 'Report Text', 'Root Cause', 'Severity', 'Date Entered']
    const csvRows = [headers.join(',')]

    history.forEach(incident => {
      const row = [
        `#${incident.id}`,
        `"${(incident.category || 'Uncategorized').replace(/"/g, '""')}"`,
        `"${(incident.incident_location || 'Unknown').replace(/"/g, '""')}"`,
        `"${(incident.incident_date || 'Unknown').replace(/"/g, '""')}"`,
        `"${incident.report_text.replace(/"/g, '""')}"`,
        `"${incident.root_cause.replace(/"/g, '""')}"`,
        incident.severity,
        incident.created_at
      ]
      csvRows.push(row.join(','))
    })

    const csvData = csvRows.join('\n')
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', 'incident_history.csv')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const downloadPDF = () => {
    generatePDF(selectedIncident)
  }

  useEffect(() => {
    fetchHistory()
  }, [refreshTrigger, currentPage, searchQuery, searchDate])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getHistory(itemsPerPage, currentPage * itemsPerPage, searchQuery, searchDate)
      setHistory(data)
    } catch (err) {
      setError('Failed to load history')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  if (loading && history.length === 0) {
    return <LoadingSpinner message="Loading history..." />
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span>📚</span> Analysis History
        </h2>

        <div className="flex items-center gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentPage(0);
              setSearchQuery(searchInput);
              setSearchDate(searchDateInput);
            }}
            className="flex gap-2"
          >
            <div className="relative group">
              <input
                type="date"
                value={searchDateInput}
                title="Filter by Date Analyzed"
                onChange={(e) => setSearchDateInput(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-40 text-slate-700 font-medium transition-all"
              />
            </div>
            <input
              type="text"
              placeholder="Search place, text..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 text-slate-700 placeholder-slate-400 transition-all shadow-sm"
            />
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
              Search
            </button>
            {(searchQuery || searchDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setSearchDateInput('');
                  setSearchDate('');
                  setCurrentPage(0);
                }}
                className="px-5 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors"
              >
                Clear
              </button>
            )}
          </form>

          {history.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                exportToCSV();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-xl transition-colors text-sm"
            >
              <span>📥</span> Export CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No incidents analyzed yet</p>
          <p className="text-gray-400 text-sm">Submit a report above to get started</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Incident Date</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Report</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Severity</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date entered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {history.map((incident) => (
                  <tr
                    key={incident.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => handleRowClick(incident.id)}
                  >
                    <td className="px-5 py-4 text-sm text-slate-500 font-mono">#{incident.id}</td>
                    <td className="px-5 py-4 text-sm text-slate-800 font-semibold">{incident.category || 'Uncategorized'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[150px]">
                      {incident.incident_location || 'Unknown'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {incident.incident_date || 'Unknown'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[200px]">
                      {incident.report_text}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(incident.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-8 flex justify-between items-center">
            <p className="text-sm text-slate-500 font-medium">
              Page {currentPage + 1} • Showing {Math.min(itemsPerPage, history.length)} incidents
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-bold rounded-xl transition-all disabled:cursor-not-allowed shadow-sm border border-slate-200"
              >
                ← Prev
              </button>
              <button
                onClick={handleNextPage}
                disabled={history.length < itemsPerPage}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-bold rounded-xl transition-all disabled:cursor-not-allowed shadow-sm border border-slate-200"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal for Incident Details */}
      {(selectedIncident || loadingDetails) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/50 hover:bg-slate-100 transition-colors"
            >
              &times;
            </button>
            <div className="p-6">
              {loadingDetails ? (
                <div className="py-24"><LoadingSpinner message="Loading incident details..." /></div>
              ) : selectedIncident && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Incident Report <span className="text-slate-400 font-mono text-xl">#{selectedIncident.id}</span></h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadPDF()
                      }}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl transition-colors"
                    >
                      <span>📄</span> Download PDF
                    </button>
                  </div>
                  <div className="p-5 bg-slate-50/50 rounded-2xl mb-8 border border-slate-100 shadow-inner">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed space-y-4">{selectedIncident.report_text}</p>
                  </div>
                  <AnalysisResult analysis={selectedIncident.analysis} similarIncidents={selectedIncident.similar_incidents} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportHistory
