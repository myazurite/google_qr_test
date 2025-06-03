"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { fetchUsers } from "@/lib/google-sheets"
import { getAvailableColumns } from "@/lib/display-settings"
import Header from "@/components/header"

export default function DisplaySettingsPage() {
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])
  const [idColumn, setIdColumn] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

    loadData()
  }, [user, router])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load users to get available columns
      const users = await fetchUsers()
      const columns = getAvailableColumns(users)
      // Remove 'id' from available columns since it's handled separately
      const filteredColumns = columns.filter((col) => col !== "id")
      setAvailableColumns(filteredColumns)

      // Load current display settings
      const settingsResponse = await fetch("/api/display-settings")
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setVisibleColumns(settingsData.settings.visibleColumns || [])
        setIdColumn(settingsData.settings.idColumn || "")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setMessage("Error loading configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage("")

      const response = await fetch("/api/display-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visibleColumns, idColumn }),
      })

      if (response.ok) {
        setMessage("✅ Display settings saved successfully!")
      } else {
        setMessage("❌ Failed to save display settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      setMessage("❌ Error saving display settings")
    } finally {
      setSaving(false)
    }
  }

  const handleColumnToggle = (column: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((col) => col !== column)
      } else {
        return [...prev, column]
      }
    })
  }

  const formatColumnName = (column: string): string => {
    return column
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
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
      <Header title="Guest Display Settings" onLogout={logout} showRefresh={false} />

      <div className="card">
        <h2>Configure Guest View</h2>
        <p>Choose which columns are visible to guest users and configure the USER ID source.</p>

        {availableColumns.length === 0 ? (
          <div className="error">No columns found. Make sure your Google Sheet has data.</div>
        ) : (
          <div>
            {/* USER ID Configuration */}
            <div className="form-group">
              <label htmlFor="id-column">USER ID Source:</label>
              <select
                id="id-column"
                className="form-control"
                value={idColumn}
                onChange={(e) => setIdColumn(e.target.value)}
                style={{ marginBottom: "0.5rem" }}
              >
                <option value="">Auto-generate (KH##### format)</option>
                {availableColumns.map((column) => (
                  <option key={column} value={column}>
                    Use column: {formatColumnName(column)}
                  </option>
                ))}
              </select>
              <small>
                {idColumn
                  ? `USER ID will be taken from the "${formatColumnName(idColumn)}" column. If empty, auto-generated IDs will be used.`
                  : "USER ID will be auto-generated in KH##### format (e.g., KH12345)."}
              </small>
            </div>

            {/* Visible Columns Configuration */}
            <div className="form-group">
              <label>Additional Visible Columns:</label>
              <small style={{ display: "block", marginBottom: "1rem", color: "#666" }}>
                USER ID is always visible. Select additional columns to show to guest users.
              </small>
              <div style={{ marginTop: "1rem" }}>
                {availableColumns.map((column) => {
                  const isVisible = visibleColumns.includes(column)

                  return (
                    <div
                      key={column}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                        padding: "0.5rem",
                        backgroundColor: "#f8f9fa",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`column-${column}`}
                        checked={isVisible}
                        onChange={() => handleColumnToggle(column)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      <label
                        htmlFor={`column-${column}`}
                        style={{
                          margin: 0,
                          cursor: "pointer",
                        }}
                      >
                        {formatColumnName(column)}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="button-group">
              <button onClick={handleSave} className="button" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <Link href="/admin" className="button button-secondary">
                Back to Dashboard
              </Link>
            </div>

            {message && <div className={`mt-2 ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Current Settings</h3>
        <p>
          <strong>USER ID Source:</strong>{" "}
          {idColumn ? `Column "${formatColumnName(idColumn)}"` : "Auto-generated (KH##### format)"}
        </p>
        <p>
          <strong>Guest Visible Columns:</strong> USER ID
          {visibleColumns.length > 0 && `, ${visibleColumns.map(formatColumnName).join(", ")}`}
        </p>
        <p>
          <strong>Total Visible to Guests:</strong> {visibleColumns.length + 1} columns
        </p>
      </div>

      <div className="card">
        <h3>Preview</h3>
        <p>This is what guest users will see when they search:</p>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>USER ID</th>
                {visibleColumns.map((column) => (
                  <th key={column}>{formatColumnName(column)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{idColumn ? `From ${formatColumnName(idColumn)}` : "KH12345"}</td>
                {visibleColumns.map((column) => (
                  <td key={column}>Sample {formatColumnName(column)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
