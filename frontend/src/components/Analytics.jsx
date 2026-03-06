import React, { useState, useEffect } from 'react'
import { getAnalytics } from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts'

/**
 * Analytics Component
 * Displays statistics about analyzed incidents
 */
const Analytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('all') // '7days', '30days', 'ytd', 'all'

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange]) // Re-fetch when dateRange changes

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError('')

      let startDateStr = null
      const today = new Date()

      switch (dateRange) {
        case '7days':
          const last7 = new Date(today)
          last7.setDate(last7.getDate() - 7)
          startDateStr = last7.toISOString().split('T')[0]
          break
        case '30days':
          const last30 = new Date(today)
          last30.setDate(last30.getDate() - 30)
          startDateStr = last30.toISOString().split('T')[0]
          break
        case 'ytd':
          const ytd = new Date(today.getFullYear(), 0, 1)
          startDateStr = ytd.toISOString().split('T')[0]
          break
        default:
          startDateStr = null // All time
      }

      // We only pass startDate. endDate is implicitly "today" in the backend logic if omitted
      const data = await getAnalytics(startDateStr, null)
      setAnalytics(data)
    } catch (err) {
      setError('Failed to load analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">📊 Advanced Analytics Dashboard</h2>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-gray-600 text-sm font-medium mr-2">Timeframe:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-gray-800 text-sm focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Total Incidents Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">{analytics.total_incidents}</div>
          <div className="text-sm opacity-90">Total Incidents</div>
        </div>

        {/* Critical Badge */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">{analytics.critical_count}</div>
          <div className="text-sm opacity-90">🚨 Critical</div>
        </div>

        {/* High Badge */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">{analytics.high_count}</div>
          <div className="text-sm opacity-90">⚠️ High</div>
        </div>

        {/* Medium Badge */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-gray-900">
          <div className="text-3xl font-bold">{analytics.medium_count}</div>
          <div className="text-sm opacity-90">⚡ Medium</div>
        </div>

        {/* Low Badge */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">{analytics.low_count}</div>
          <div className="text-sm opacity-90">✓ Low</div>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

        {/* Severity Pie Chart */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Severity Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Critical', value: analytics.critical_count },
                    { name: 'High', value: analytics.high_count },
                    { name: 'Medium', value: analytics.medium_count },
                    { name: 'Low', value: analytics.low_count }
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell key="Critical" fill="#EF4444" />
                  <Cell key="High" fill="#F97316" />
                  <Cell key="Medium" fill="#EAB308" />
                  <Cell key="Low" fill="#22C55E" />
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Incidents by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(analytics.category_distribution || {}).map(([name, value]) => ({ name, value }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents Over Time Line Chart */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Incident Trend Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.incidents_over_time || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Incidents Reported" stroke="#8B5CF6" activeDot={{ r: 8 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}

export default Analytics
