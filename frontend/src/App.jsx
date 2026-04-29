import React, { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Landing from './components/Landing'
import { healthCheck } from './services/api'
import './App.css'

/**
 * App Content Component
 */
function AppContent({ showDashboard, setShowDashboard }) {
  const [isConnected, setIsConnected] = React.useState(false)
  const [checkingConnection, setCheckingConnection] = React.useState(true)

  useEffect(() => {
    // Check backend connection on app load
    const checkConnection = async () => {
      try {
        await healthCheck()
        setIsConnected(true)
      } catch (error) {
        console.error('Backend connection error:', error)
        setIsConnected(false)
      } finally {
        setCheckingConnection(false)
      }
    }

    checkConnection()

    // Retry connection every 5 seconds if not connected
    const interval = setInterval(() => {
      if (!isConnected) {
        checkConnection()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isConnected])

  if (checkingConnection) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connection Error
          </h1>
          <p className="text-gray-600 mb-4">
            Unable to connect to the backend server. Please ensure the FastAPI server is running at{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8000</code>
          </p>
          <p className="text-sm text-gray-500">
            Retrying automatically...
          </p>
        </div>
      </div>
    )
  }

  // If connected, show landing or dashboard based on state
  if (!showDashboard) {
    return <Landing onGetStarted={() => setShowDashboard(true)} />
  }

  return <Dashboard />
}

/**
 * App Component
 * Root component of the application
 */
function App() {
  const [showDashboard, setShowDashboard] = useState(false)

  return (
    <AppContent showDashboard={showDashboard} setShowDashboard={setShowDashboard} />
  )
}

export default App
