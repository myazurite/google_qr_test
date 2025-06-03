"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { fetchUsers, type User } from "@/lib/google-sheets"
import Header from "@/components/header"
import LoadingSpinner from "@/components/loading-spinner"

export default function SearchPage() {
  const [searchId, setSearchId] = useState("")
  const [searchResult, setSearchResult] = useState<User | null>(null)
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
  const { user, logout, loading: authLoading } = useAuth()
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

    if (!searchId.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const users = await fetchUsers()
      const result = users.find((user) => user.id === searchId.trim())
      setSearchResult(result || null)
    } catch (err) {
      console.error("Search error:", err)
      setSearchResult(null)
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
    if (!isGuestUser) {
      // Admin users see all fields
      return Object.entries(user).filter(([key, value]) => value && value.toString().trim() !== "")
    }

    // Guest users see only configured visible fields
    console.log("Search: Filtering fields for guest user")
    console.log("Search: Display settings:", displaySettings)
    console.log("Search: User data:", user)

    const visibleFields = Object.entries(user).filter(([key, value]) => {
      const hasValue = value && value.toString().trim() !== ""
      const isVisible = isColumnVisibleToGuests(key)
      console.log(`Search: Field ${key} - hasValue: ${hasValue}, isVisible: ${isVisible}`)
      return hasValue && isVisible
    })

    console.log("Search: Visible fields for guest:", visibleFields)
    return visibleFields
  }

  const handleBackToHome = () => {
    if (user?.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/search")
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
      <Header title={isGuestUser ? "Guest Search" : "User Search"} onLogout={logout} showRefresh={false} />

      {isGuestUser && (
        <div className="card" style={{ backgroundColor: "#f0f8ff", border: "1px solid #0066cc" }}>
          <p style={{ margin: 0, color: "#0066cc" }}>
            👋 Logged in as a guest user.
          </p>
        </div>
      )}

      <div className="card search-container">
        <h2>Search by USER ID</h2>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Enter USER ID (e.g., KH12345)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button type="submit" className="button">
            Search
          </button>
        </form>

        {/* Back to Home button */}
        <div style={{ marginTop: "1rem" }}>
          <button onClick={handleBackToHome} className="button button-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {searched && !loading && (
        <div className="card">
          {searchResult ? (
            <div>
              <h3>User Found</h3>
              <table className="table">
                <tbody>
                  {getVisibleFields(searchResult).map(([key, value]) => (
                    <tr key={key}>
                      <td>
                        <strong>{formatFieldName(key)}</strong>
                      </td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2">
                <Link href={`/user/${searchResult.id}`} className="button">
                  View Details & QR Code
                </Link>
              </div>
            </div>
          ) : (
            <div className="error">No user found with USER ID: {searchId}</div>
          )}
        </div>
      )}
    </div>
  )
}
