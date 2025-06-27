"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import Header from "@/components/header"

export default function SheetsDebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [simpleTest, setSimpleTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "admin") {
      router.push("/search")
      return
    }
  }, [user, router])

  const runDebugTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-sheets")
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error("Error running debug test:", error)
      setDebugData({ error: "Failed to run debug test" })
    } finally {
      setLoading(false)
    }
  }

  const runSimpleTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/simple-sheets-test")
      const data = await response.json()
      setSimpleTest(data)
    } catch (error) {
      console.error("Error running simple test:", error)
      setSimpleTest({ error: "Failed to run simple test" })
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="container">
      <Header title="Google Sheets Debug" onLogout={logout} showRefresh={false} />

      <div className="card">
        <h2>Google Sheets Connection Debugging</h2>
        <p>Use these tools to diagnose Google Sheets connectivity issues.</p>

        <div className="button-group">
          <button onClick={runSimpleTest} className="button" disabled={loading}>
            {loading ? "Testing..." : "Run Simple Test"}
          </button>
          <button onClick={runDebugTest} className="button button-secondary" disabled={loading}>
            {loading ? "Testing..." : "Run Full Debug"}
          </button>
          <Link href="/admin" className="button">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {simpleTest && (
        <div className="card">
          <h3>Simple Test Results</h3>
          <div className={`mb-2 ${simpleTest.success ? "success" : "error"}`}>
            Status: {simpleTest.success ? "✅ SUCCESS" : "❌ FAILED"}
          </div>
          <pre style={{ background: "#f5f5f5", padding: "1rem", overflow: "auto", fontSize: "0.875rem" }}>
            {JSON.stringify(simpleTest, null, 2)}
          </pre>
        </div>
      )}

      {debugData && (
        <div className="card">
          <h3>Full Debug Results</h3>

          {/* Environment Variables */}
          <div className="mb-2">
            <h4>Environment Variables</h4>
            <div className="status-grid">
              <div className="status-item">
                <strong>Google Sheet ID:</strong>
                <span className={debugData.environment?.hasSheetId ? "success" : "error"}>
                  {debugData.environment?.hasSheetId
                    ? `✅ Set (${debugData.environment.sheetIdPreview})`
                    : "❌ Missing"}
                </span>
              </div>
              <div className="status-item">
                <strong>API Key:</strong>
                <span className={debugData.environment?.hasApiKey ? "success" : "error"}>
                  {debugData.environment?.hasApiKey ? `✅ Set (${debugData.environment.apiKeyPreview})` : "❌ Missing"}
                </span>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {debugData.tests && debugData.tests.length > 0 && (
            <div className="mb-2">
              <h4>Test Results</h4>
              {debugData.tests.map((test: any, index: number) => (
                <div
                  key={index}
                  className="mb-2"
                  style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "4px" }}
                >
                  <div className="flex justify-between align-center">
                    <strong>{test.test}</strong>
                    <span className={test.status === "PASSED" ? "success" : "error"}>
                      {test.status === "PASSED" ? "✅ PASSED" : test.status === "FAILED" ? "❌ FAILED" : "⚠️ EXCEPTION"}
                    </span>
                  </div>
                  {test.error && (
                    <div className="error" style={{ marginTop: "0.5rem" }}>
                      Error: {test.error}
                    </div>
                  )}
                  {test.details && (
                    <details style={{ marginTop: "0.5rem" }}>
                      <summary>Details</summary>
                      <pre
                        style={{ background: "#f8f9fa", padding: "0.5rem", fontSize: "0.75rem", marginTop: "0.5rem" }}
                      >
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Raw Debug Data */}
          <details>
            <summary>Raw Debug Data</summary>
            <pre style={{ background: "#f5f5f5", padding: "1rem", overflow: "auto", fontSize: "0.75rem" }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div className="card">
        <h3>Common Issues & Solutions</h3>
        <ul>
          <li>
            <strong>Missing Environment Variables:</strong> Make sure GOOGLE_SHEET_ID and GOOGLE_SHEETS_API_KEY are set
          </li>
          <li>
            <strong>HTTP 403 Forbidden:</strong> Check if your Google Sheet is publicly readable
          </li>
          <li>
            <strong>HTTP 400 Bad Request:</strong> Verify your Sheet ID is correct
          </li>
          <li>
            <strong>HTTP 403 API Key Error:</strong> Ensure your API key has Google Sheets API enabled
          </li>
          <li>
            <strong>Network Errors:</strong> Check internet connectivity and firewall settings
          </li>
        </ul>
      </div>
    </div>
  )
}
