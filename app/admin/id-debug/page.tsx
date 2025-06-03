"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import Header from "@/components/header"

export default function IdDebugPage() {
  const [idStats, setIdStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
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

    loadIdStats()
  }, [user, router])

  const loadIdStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/id-manager")
      if (response.ok) {
        const data = await response.json()
        setIdStats(data)
      }
    } catch (error) {
      console.error("Error loading ID stats:", error)
      setMessage("Error loading ID statistics")
    } finally {
      setLoading(false)
    }
  }

  const clearAllIds = async () => {
    if (!confirm("Are you sure you want to clear all stored IDs? This will regenerate IDs for all users.")) {
      return
    }

    try {
      setMessage("Clearing IDs...")
      const response = await fetch("/api/id-manager", { method: "DELETE" })
      if (response.ok) {
        setMessage("✅ All IDs cleared successfully!")
        loadIdStats()
      } else {
        setMessage("❌ Failed to clear IDs")
      }
    } catch (error) {
      console.error("Error clearing IDs:", error)
      setMessage("❌ Error clearing IDs")
    }
  }

  if (!user || user.role !== "admin") {
    return null
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Header title="ID Management Debug" onLogout={logout} showRefresh={false} />

      <div className="card">
        <h2>Persistent ID Statistics</h2>
        {idStats && (
          <div>
            <p>
              <strong>Total Stored IDs:</strong> {idStats.stats.totalStoredIds}
            </p>
            <p>
              <strong>Generated IDs:</strong> {idStats.stats.storedIds.join(", ") || "None"}
            </p>
          </div>
        )}

        <div className="button-group">
          <button onClick={loadIdStats} className="button button-secondary">
            Refresh Stats
          </button>
          <button onClick={clearAllIds} className="button button-danger">
            Clear All IDs
          </button>
          <Link href="/admin" className="button">
            Back to Dashboard
          </Link>
        </div>

        {message && <div className={`mt-2 ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}
      </div>

      {idStats && idStats.allIds && Object.keys(idStats.allIds).length > 0 && (
        <div className="card">
          <h3>Stored ID Mappings</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Row Key</th>
                  <th>Generated ID</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(idStats.allIds).map(([rowKey, id]) => (
                  <tr key={rowKey}>
                    <td style={{ fontSize: "0.875rem", maxWidth: "300px", wordBreak: "break-all" }}>{rowKey}</td>
                    <td>
                      <strong>{id as string}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h3>How Persistent IDs Work</h3>
        <ul>
          <li>Each row in your Google Sheet gets a unique identifier based on its content</li>
          <li>Once an ID is generated for a row, it stays the same even after refreshing data</li>
          <li>IDs are only regenerated if you clear them manually or if row content changes significantly</li>
          <li>This ensures guests can always find users with the same ID</li>
        </ul>
      </div>
    </div>
  )
}
