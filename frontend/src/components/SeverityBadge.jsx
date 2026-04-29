import React from 'react'

/**
 * SeverityBadge Component
 * Displays severity level with color coding
 */
const SeverityBadge = ({ severity }) => {
  const getSeverityColor = (level) => {
    const colors = {
      'Critical': 'bg-red-50 text-red-700 border-red-200',
      'High': 'bg-orange-50 text-orange-700 border-orange-200',
      'Medium': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Low': 'bg-green-50 text-green-700 border-green-200'
    }
    return colors[level] || 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const getSeverityIcon = (level) => {
    const icons = {
      'Critical': '🚨',
      'High': '⚠️',
      'Medium': '⚡',
      'Low': '✓'
    }
    return icons[level] || '•'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getSeverityColor(severity)}`}>
      <span className="text-sm">{getSeverityIcon(severity)}</span>
      {severity}
    </span>
  )
}

export default SeverityBadge
