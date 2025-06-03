"use client"

import { useState, useEffect } from "react"

interface SystemStatus {
  isConnected: boolean
  userCount: number
  lastUpdated: string
  usingMockData: boolean
}

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    isConnected: false,
    userCount: 0,
    lastUpdated: new Date().toLocaleString(),
    usingMockData: true,
  })

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/users")
      const users = await response.json()

      const isMockData = users.length > 0 && users[0].id === "KH00001" && users[0].name === "John Doe"

      setStatus({
        isConnected: response.ok,
        userCount: users.length || 0,
        lastUpdated: new Date().toLocaleString(),
        usingMockData: isMockData,
      })
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        lastUpdated: new Date().toLocaleString(),
      }))
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="card">
      <h3>System Status</h3>
      <div className="status-grid">
        <div className="status-item">
          <strong>Connection:</strong>
          <span className={status.isConnected ? "success" : "error"}>
            {status.isConnected ? "✅ Connected" : "❌ Disconnected"}
          </span>
        </div>
        <div className="status-item">
          <strong>Data Source:</strong>
          <span className={status.usingMockData ? "error" : "success"}>
            {status.usingMockData ? "Mock Data" : "Google Sheets"}
          </span>
        </div>
        <div className="status-item">
          <strong>Total Users:</strong>
          <span>{status.userCount}</span>
        </div>
        <div className="status-item">
          <strong>Last Updated:</strong>
          <span>{status.lastUpdated}</span>
        </div>
      </div>
    </div>
  )
}
