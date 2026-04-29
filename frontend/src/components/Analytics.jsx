import React, { useState, useEffect } from 'react'
import { getAnalytics } from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import IncidentMap from './IncidentMap'
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span>📊</span> Advanced Analytics Dashboard
        </h2>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-100 transition-colors">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mr-3">Timeframe:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-medium text-sm focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <span>🔄</span> Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Total Incidents Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md shadow-slate-900/10">
          <div className="text-4xl font-black tracking-tight mb-1">{analytics.total_incidents}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Incidents</div>
        </div>

        {/* Critical Badge */}
        <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-2xl p-6 text-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
          <div className="text-4xl font-black tracking-tight mb-1 text-red-600">{analytics.critical_count}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><span className="text-[10px]">🚨</span> Critical</div>
        </div>

        {/* High Badge */}
        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-6 text-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
          <div className="text-4xl font-black tracking-tight mb-1 text-orange-600">{analytics.high_count}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><span className="text-[10px]">⚠️</span> High</div>
        </div>

        {/* Medium Badge */}
        <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 rounded-2xl p-6 text-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
          <div className="text-4xl font-black tracking-tight mb-1 text-yellow-600">{analytics.medium_count}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><span className="text-[10px]">⚡</span> Medium</div>
        </div>

        {/* Low Badge */}
        <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-2xl p-6 text-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
          <div className="text-4xl font-black tracking-tight mb-1 text-green-600">{analytics.low_count}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><span className="text-[10px]">✓</span> Low</div>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">


        {/* Severity Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Severity Distribution</h3>
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
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Incidents by Category</h3>
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

        {/* Incidents by Location Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Incidents by Location</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(analytics.location_distribution || {}).map(([name, value]) => ({ name, value }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Date Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Incidents by Date</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.incidents_over_time || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Incidents Reported" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}

export default Analytics
