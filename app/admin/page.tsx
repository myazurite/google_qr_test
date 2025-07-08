"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { fetchUsers, type User } from "@/lib/google-sheets"
import UserTable from "@/components/user-table"
import Header from "@/components/header"
import LoadingSpinner from "@/components/loading-spinner"
import SearchBar from "@/components/search-bar"

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [dataSource, setDataSource] = useState<"mock" | "sheets" | "empty" | "unknown">("unknown")
  const { user, logout, enterGuestPreview } = useAuth()
  const router = useRouter()

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
        console.log("Admin: Force refreshing data from Google Sheets...")
      } else {
        setLoading(true)
        console.log("Admin: Loading user data...")
      }

      const data = await fetchUsers(forceRefresh)
      setUsers(data)
      setFilteredUsers(data)

      // Check if this is mock data
      const isMockData = data.some(
        (user) => user.id === "EMP001" && user.name === "John Doe" && user.email === "john.doe@example.com",
      )

      if (isMockData) {
        setDataSource("mock")
      } else if (data.length === 0) {
        setDataSource("empty")
      } else {
        setDataSource("sheets")
      }

      console.log("Admin: Data source:", dataSource, "Users:", data.length)
      setError("")
    } catch (err) {
      setError("Failed to load user data")
      console.error("Admin: Error loading data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    console.log("Admin: Manual refresh triggered")
    loadData(true) // Force refresh
  }

  // Handle search - now searches across all fields dynamically
  const handleSearch = (term: string) => {
    setSearchTerm(term)

    if (!term.trim()) {
      setFilteredUsers(users)
      return
    }

    const lowerTerm = term.toLowerCase()
    const filtered = users.filter((user) => {
      // Search across all fields in the user object
      return Object.values(user).some((value) => value && value.toString().toLowerCase().includes(lowerTerm))
    })

    setFilteredUsers(filtered)
  }

  const handleTestGuestSearch = () => {
    // Enter guest preview mode instead of opening a new tab
    console.log("Admin: Entering guest preview mode for testing")
    enterGuestPreview()
  }

  useEffect(() => {
    if (!user) {
      console.log("Admin: No user, redirecting to login")
      router.push("/login")
      return
    }

    if (user.role !== "admin") {
      console.log("Admin: User is not admin, redirecting to search")
      router.push("/search")
      return
    }

    console.log("Admin: User is admin, loading dashboard")
    loadData()
  }, [user, router])

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="container">
      <Header
        title="Admin Dashboard"
        onRefresh={handleRefresh}
        onLogout={logout}
        configLink="/admin/config"
        showRefresh={!refreshing}
      />

      {error && <div className="error">{error}</div>}

      {refreshing && (
        <div className="card" style={{ backgroundColor: "#f0f8ff", border: "1px solid #0066cc" }}>
          <p style={{ margin: 0, color: "#0066cc" }}>🔄 Refreshing data from Google Sheets...</p>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between align-center">
          <h2>Data Source</h2>
          {dataSource === "mock" ? (
            <span className="error">
              ⚠️ Using mock data - <Link href="/admin/config">Configure Google Sheets</Link>
            </span>
          ) : dataSource === "empty" ? (
            <span className="error">
              ⚠️ Google Sheets connected but no data - <Link href="/admin/config">Add data to your sheet</Link>
            </span>
          ) : dataSource === "sheets" ? (
            <span className="success">✅ Using Google Sheets data</span>
          ) : (
            <span>Loading...</span>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div className="button-group">
          <Link href="/admin/config" className="button">
            Google Sheets Settings
          </Link>
          <Link href="/admin/display-settings" className="button button-secondary">
            Guest Display Settings
          </Link>
          {/*<button onClick={handleTestGuestSearch} className="button button-secondary">*/}
          {/*  🔍 Preview as Guest*/}
          {/*</button>*/}
          <Link href="/admin/sheets-debug" className="button button-secondary">
            Debug Google Sheets
          </Link>
          <Link href="/debug" className="button button-secondary">
            Debug Information
          </Link>
          <Link href="https://pnipc-qr-nomailer.vercel.app/admin" target="_blank" className="button button-secondary">
            Company list
          </Link>
          <Link href="https://google-qr-b2c.vercel.app/" target="_blank" className="button button-secondary">
            B2c list
          </Link>
        </div>
      </div>

      <div className="card">
        <SearchBar placeholder="Search across all fields..." value={searchTerm} onChange={handleSearch} />

        {searchTerm && (
          <div className="search-results-info">
            Found {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
            {filteredUsers.length > 0 ? "" : " - "}
            {filteredUsers.length === 0 && (
              <button className="clear-search" onClick={() => handleSearch("")}>
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {loading || refreshing ? <LoadingSpinner /> : <UserTable users={filteredUsers} />}
    </div>
  )
}
