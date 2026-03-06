import React, { useState, useEffect } from 'react'
import { getHistory, getIncident } from '../services/api'
import SeverityBadge from './SeverityBadge'
import LoadingSpinner from './LoadingSpinner'
import AnalysisResult from './AnalysisResult'
import { formatDistanceToNow } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

    const headers = ['ID', 'Category', 'Report Text', 'Root Cause', 'Severity', 'Date']
    const csvRows = [headers.join(',')]

    history.forEach(incident => {
      const row = [
        `#${incident.id}`,
        `"${(incident.category || 'Uncategorized').replace(/"/g, '""')}"`,
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
    if (!selectedIncident) return

    try {
      const doc = new jsPDF()

      // Title
      doc.setFontSize(22)
      doc.setTextColor(40, 40, 40)
      doc.text(`Incident Report #${selectedIncident.id}`, 14, 20)

      // Meta data
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28)

      // Original Report Section
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('Original Report', 14, 40)

      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      const splitReport = doc.splitTextToSize(selectedIncident.report_text, 180)
      doc.text(splitReport, 14, 48)

      let currentY = 48 + (splitReport.length * 5) + 10

      // Analysis Section
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('AI Analysis Summary', 14, currentY)

      const analysisInfo = [
        ['Category', selectedIncident.analysis.category || 'Uncategorized'],
        ['Severity', selectedIncident.analysis.severity],
        ['Root Cause', selectedIncident.analysis.root_cause]
      ]

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Attribute', 'Details']],
        body: analysisInfo,
        theme: 'grid',
        headStyles: { fillColor: [66, 135, 245] }
      })

      currentY = doc.lastAutoTable.finalY + 15

      // Contributing Factors
      if (selectedIncident.analysis.contributing_factors?.length) {
        doc.setFontSize(14)
        doc.text('Contributing Factors', 14, currentY)
        const factors = selectedIncident.analysis.contributing_factors.map(f => [f])

        autoTable(doc, {
          startY: currentY + 5,
          body: factors,
          theme: 'plain',
          styles: { cellPadding: 2, fontSize: 11, textColor: [80, 80, 80] }
        })
        currentY = doc.lastAutoTable.finalY + 10
      }

      // Prevention Measures
      if (selectedIncident.analysis.prevention_measures?.length) {
        doc.setFontSize(14)
        doc.text('Prevention Measures', 14, currentY)
        const measures = selectedIncident.analysis.prevention_measures.map(m => [m])

        autoTable(doc, {
          startY: currentY + 5,
          body: measures,
          theme: 'plain',
          styles: { cellPadding: 2, fontSize: 11, textColor: [20, 120, 40] }
        })
      }

      // Save PDF using native jsPDF method
      doc.save(`incident_${selectedIncident.id}_report.pdf`)
    } catch (err) {
      console.error("PDF Generate Error:", err)
      alert("Failed to generate PDF: " + err.message)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [refreshTrigger, currentPage])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getHistory(itemsPerPage, currentPage * itemsPerPage)
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📚 Analysis History</h2>
        {history.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              exportToCSV()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to CSV
          </button>
        )}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Report</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Root Cause</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Severity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((incident) => (
                  <tr
                    key={incident.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => handleRowClick(incident.id)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">#{incident.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{incident.category || 'Uncategorized'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 truncate max-w-xs">
                      {incident.report_text}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-xs">
                      {incident.root_cause}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(incident.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Page {currentPage + 1} • Showing {Math.min(itemsPerPage, history.length)} incidents
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold rounded-lg transition disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={history.length < itemsPerPage}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold rounded-lg transition disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal for Incident Details */}
      {(selectedIncident || loadingDetails) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
            >
              &times;
            </button>
            <div className="p-6">
              {loadingDetails ? (
                <div className="py-12"><LoadingSpinner message="Loading incident details..." /></div>
              ) : selectedIncident && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Incident #{selectedIncident.id} Report</h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadPDF()
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded shadow transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg mb-6 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedIncident.report_text}</p>
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
