"use client"

import Link from "next/link"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { fetchUsers, type User } from "@/lib/google-sheets"
import Header from "@/components/header"
import LoadingSpinner from "@/components/loading-spinner"

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [displaySettings, setDisplaySettings] = useState<{
    visibleColumns: string[]
    alwaysVisible: string[]
  }>({
    visibleColumns: [],
    alwaysVisible: ["id"],
  })
  const { user, logout, exitGuestPreview, isGuestPreview, loading: authLoading } = useAuth()
  const router = useRouter()

  const isGuestUser = user?.role === "guest"

  useEffect(() => {
    // Wait for auth to finish loading before making access decisions
    if (!authLoading) {
      setPageLoading(false)
      if (!user) {
        console.log("Search: No user, redirecting to login")
        router.push("/login")
      }
    }
  }, [user, router, authLoading])

  // Load display settings when component mounts
  useEffect(() => {
    const loadDisplaySettings = async () => {
      try {
        const response = await fetch("/api/display-settings")
        if (response.ok) {
          const data = await response.json()
          console.log("Search: Loaded display settings:", data.settings)
          setDisplaySettings(data.settings)
        }
      } catch (error) {
        console.error("Search: Error loading display settings:", error)
      }
    }

    if (user) {
      loadDisplaySettings()
    }
  }, [user])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchTerm.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const users = await fetchUsers()
      const lowerTerm = searchTerm.toLowerCase()

      // Search across all fields
      const results = users.filter((user) => {
        return Object.values(user).some((value) => value && value.toString().toLowerCase().includes(lowerTerm))
      })

      setSearchResults(results)
    } catch (err) {
      console.error("Search error:", err)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // Function to format field names nicely
  const formatFieldName = (key: string): string => {
    if (key === "id") return "USER ID"
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  // Function to check if a column should be visible to guests
  const isColumnVisibleToGuests = (columnName: string): boolean => {
    return displaySettings.alwaysVisible.includes(columnName) || displaySettings.visibleColumns.includes(columnName)
  }

  // Function to get visible fields for display
  const getVisibleFields = (user: User) => {
    if (!isGuestUser && !isGuestPreview) {
      // Admin users (not in preview mode) see all fields
      return Object.entries(user).filter(([key, value]) => value && value.toString().trim() !== "")
    }

    // Guest users and admin in preview mode see only configured visible fields
    console.log("Search: Filtering fields for guest user or preview mode")
    console.log("Search: Display settings:", displaySettings)
    console.log("Search: User data:", user)

    const visibleFields = Object.entries(user).filter(([key, value]) => {
      const hasValue = value && value.toString().trim() !== ""
      const isVisible = isColumnVisibleToGuests(key)
      console.log(`Search: Field ${key} - hasValue: ${hasValue}, isVisible: ${isVisible}`)
      return hasValue && isVisible
    })

    console.log("Search: Visible fields for guest/preview:", visibleFields)
    return visibleFields
  }

  const handleBackToHome = () => {
    if (isGuestPreview) {
      exitGuestPreview()
    } else if (user?.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/search")
    }
  }

  const handleLogout = () => {
    if (isGuestPreview) {
      exitGuestPreview()
    } else {
      logout()
    }
  }

  if (authLoading || pageLoading) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h2>Redirecting to login...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Header
        title={isGuestPreview ? "🔍 Guest Preview Mode" : isGuestUser ? "Guest Search" : "User Search"}
        onLogout={handleLogout}
        showRefresh={false}
      />

      {isGuestPreview && (
        <div className="card" style={{ backgroundColor: "#fff3cd", border: "1px solid #ffeeba" }}>
          <div className="flex justify-between align-center">
            <p style={{ margin: 0, color: "#856404" }}>
              🔍 <strong>Admin Preview Mode:</strong> You're seeing exactly what guest users see. Display settings are
              being applied.
            </p>
            <button onClick={exitGuestPreview} className="button button-secondary">
              Exit Preview
            </button>
          </div>
        </div>
      )}

      {isGuestUser && !isGuestPreview && (
        <div className="card" style={{ backgroundColor: "#f0f8ff", border: "1px solid #0066cc" }}>
          <p style={{ margin: 0, color: "#0066cc" }}>
            👋 You're logged in as a guest user. <Link href="/login">Login as admin</Link> for full access.
          </p>
        </div>
      )}

      <div className="card search-container">
        <h2>Search by USER ID</h2>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Enter USER ID (e.g., EMP001) or search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="button">
            Search
          </button>
        </form>

        {/* Back to Home button */}
        <div style={{ marginTop: "1rem" }}>
          <button onClick={handleBackToHome} className="button button-secondary">
            {isGuestPreview ? "Back to Admin Dashboard" : "Back to Homepage"}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {searched && !loading && (
        <div className="card">
          {searchResults.length > 0 ? (
            <div>
              <h3>Search Results ({searchResults.length})</h3>
              {searchResults.map((result, index) => (
                <div
                  key={result.id || index}
                  style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <table className="table">
                    <tbody>
                      {getVisibleFields(result).map(([key, value]) => (
                        <tr key={key}>
                          <td>
                            <strong>{formatFieldName(key)}</strong>
                          </td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: "0.5rem" }}>
                    <Link href={`/user/${result.id}`} className="button">
                      View Profile & QR Code
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="error">No users found matching: "{searchTerm}"</div>
          )}
        </div>
      )}
    </div>
  )
}
