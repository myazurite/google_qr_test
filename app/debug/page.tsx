"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { fetchUsers, type User } from "@/lib/google-sheets"
import { useAuth } from "@/hooks/use-auth"

export default function DebugPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [apiTest, setApiTest] = useState<any>(null)
  const [testingApi, setTestingApi] = useState(false)
  const { getHomeRoute } = useAuth()
  const homeRoute = getHomeRoute()

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const testGoogleSheetsAPI = async () => {
    setTestingApi(true)
    try {
      const response = await fetch("/api/test-sheets")
      const data = await response.json()
      setApiTest(data)
    } catch (err) {
      setApiTest({ error: "Failed to test API", details: String(err) })
    } finally {
      setTestingApi(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const isMockData = users.some(
    (user) => user.id === "EMP001" && user.name === "John Doe" && user.email === "john.doe@example.com",
  )

  return (
    <div className="container">
      <div className="card">
        <h1>Debug Information</h1>

        <div className="mb-2">
          <button onClick={loadData} className="button button-secondary" disabled={loading}>
            {loading ? "Loading..." : "Reload Data"}
          </button>
          <button onClick={testGoogleSheetsAPI} className="button" disabled={testingApi} style={{ marginLeft: "1rem" }}>
            {testingApi ? "Testing..." : "Test Google Sheets API"}
          </button>
          <Link href={homeRoute} className="button" style={{ marginLeft: "1rem" }}>
            Back to Dashboard
          </Link>
        </div>

        <h3>Environment Variables</h3>
        <p>NEXT_PUBLIC_BASE_URL: {process.env.NEXT_PUBLIC_BASE_URL || "Not set"}</p>

        <h3>Data Status</h3>
        <p>Loading: {loading ? "Yes" : "No"}</p>
        <p>Error: {error || "None"}</p>
        <p>Users loaded: {users.length}</p>
        <p>Data source: {isMockData ? "Mock Data" : "Google Sheets"}</p>

        {apiTest && (
          <>
            <h3>Google Sheets API Test Result</h3>
            <pre style={{ background: "#f5f5f5", padding: "1rem", overflow: "auto", fontSize: "0.8rem" }}>
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          </>
        )}

        <h3>User Data Sample</h3>
        <pre style={{ background: "#f5f5f5", padding: "1rem", overflow: "auto", fontSize: "0.8rem" }}>
          {JSON.stringify(users.slice(0, 2), null, 2)}
        </pre>
      </div>
    </div>
  )
}
