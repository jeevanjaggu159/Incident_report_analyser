import axios from 'axios'

/**
 * API Service for Incident Report Analyzer
 * Handles all backend API communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Analyze an incident report
 * @param {string} reportText - The incident report to analyze
 * @returns {Promise} Analysis results
 */
export const analyzeIncident = async (reportText) => {
  try {
    const response = await apiClient.post('/api/analyze', {
      report_text: reportText,
    })
    return response.data
  } catch (error) {
    throw error.response?.data || new Error(error.message)
  }
}

/**
 * Get history of analyzed incidents
 * @param {number} limit - Number of records to fetch
 * @param {number} offset - Number of records to skip
 * @returns {Promise} List of incidents
 */
export const getHistory = async (limit = 20, offset = 0, search = '', date = '') => {
  try {
    const params = { limit, offset }
    if (search) params.search = search
    if (date) params.date = date
    const response = await apiClient.get('/api/history', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || new Error(error.message)
  }
}

/**
 * Get details of a specific incident
 * @param {number} incidentId - ID of the incident
 * @returns {Promise} Incident details
 */
export const getIncident = async (incidentId) => {
  try {
    const response = await apiClient.get(`/api/incident/${incidentId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || new Error(error.message)
  }
}

/**
 * Get analytics data
 * @param {string} startDate - Optional start date (YYYY-MM-DD)
 * @param {string} endDate - Optional end date (YYYY-MM-DD)
 * @returns {Promise} Analytics data
 */
export const getAnalytics = async (startDate, endDate) => {
  try {
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate

    const response = await apiClient.get('/api/analytics', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || new Error(error.message)
  }
}

/**
 * Health check
 * @returns {Promise} Health status
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health')
    return response.data
  } catch (error) {
    throw error.response?.data || new Error(error.message)
  }
}

/**
 * Ask a question about the incident data (RAG)
 * @param {string} query - The user's question
 * @param {Array} history - The conversation history array
 * @returns {Promise} AI generated answer and sources
 */
export const askQuestion = async (query, history = []) => {
  try {
    const response = await apiClient.post('/api/chat', { query, history })
    return response.data
  } catch (error) {
    throw error.response?.data || new Error(error.message)
  }
}

export default apiClient
