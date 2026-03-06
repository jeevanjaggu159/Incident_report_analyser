import React from 'react'

/**
 * SeverityBadge Component
 * Displays severity level with color coding
 */
const SeverityBadge = ({ severity }) => {
  const getSeverityColor = (level) => {
    const colors = {
      'Critical': 'bg-severity-critical text-white',
      'High': 'bg-severity-high text-white',
      'Medium': 'bg-severity-medium text-gray-900',
      'Low': 'bg-severity-low text-gray-900'
    }
    return colors[level] || 'bg-gray-400 text-white'
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
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm ${getSeverityColor(severity)}`}>
      <span>{getSeverityIcon(severity)}</span>
      {severity}
    </span>
  )
}

export default SeverityBadge
