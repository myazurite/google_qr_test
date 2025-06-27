"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { fetchUsers, type User } from "@/lib/google-sheets"
import QRCode from "@/components/qr-code"
import UserProfile from "@/components/user-profile"
import LoadingSpinner from "@/components/loading-spinner"
import { useAuth } from "@/hooks/use-auth"

// Mock user for fallback when fetch fails
const MOCK_USER_FALLBACK: User = {
  id: "EMP001",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 555-123-4567",
  address: "123 Main St, Anytown, USA",
  company: "Acme Inc",
  position: "Software Engineer",
}

export default function UserPage() {
  const params = useParams()
  const id = params.id as string
  const { user, getHomeRoute, isGuestPreview, exitGuestPreview } = useAuth()

  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [displaySettings, setDisplaySettings] = useState<{
    visibleColumns: string[]
    alwaysVisible: string[]
  }>({
    visibleColumns: [],
    alwaysVisible: [],
  })
  const [usedFallback, setUsedFallback] = useState(false)

  // For public access (QR codes), treat as guest view
  const isPublicAccess = !user
  const isGuestUser = user?.role === "guest"
  const shouldApplyGuestRestrictions = isPublicAccess || isGuestUser || isGuestPreview

  // Load display settings
  useEffect(() => {
    const loadDisplaySettings = async () => {
      try {
        const response = await fetch("/api/display-settings")
        if (response.ok) {
          const data = await response.json()
          console.log("User Page: Loaded display settings:", data.settings)
          setDisplaySettings(data.settings)
        }
      } catch (error) {
        console.error("User Page: Error loading display settings:", error)
      }
    }

    // Load display settings regardless of auth status for public access
    loadDisplaySettings()
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true)
        setError("")
        setUsedFallback(false)

        // Try to fetch users from the API
        const users = await fetchUsers()
        const foundUser = users.find((u) => u.id === id)

        if (foundUser) {
          setUserData(foundUser)
        } else {
          // If the specific user is not found, check if we're using mock data
          const isMockData = users.some((u) => u.id === "EMP001" && u.name === "John Doe")

          if (isMockData) {
            // If we're using mock data, provide a fallback user
            console.log("User Page: Using mock data fallback for user:", id)
            setUserData({
              ...MOCK_USER_FALLBACK,
              id, // Use the requested ID
            })
            setUsedFallback(true)
          } else {
            setError(`User with ID ${id} not found`)
          }
        }
      } catch (err) {
        console.error("Error loading user:", err)

        // Provide a fallback user in case of error
        console.log("User Page: Using fallback user due to error")
        setUserData({
          ...MOCK_USER_FALLBACK,
          id, // Use the requested ID
        })
        setUsedFallback(true)
        setError("Failed to load user data from Google Sheets. Using fallback data.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadUser()
    }
  }, [id])

  const handleBackToHome = () => {
    if (isGuestPreview) {
      exitGuestPreview()
    } else if (user) {
      // User is logged in, go to their home route
      const homeRoute = getHomeRoute()
      window.location.href = homeRoute
    } else {
      // Public access, go to login page
      window.location.href = "/login"
    }
  }

  if (loading) {
    return (
      <div className="container">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !userData) {
    return (
      <div className="container">
        <div className="card user-profile">
          <h1>Error</h1>
          <div className="error">{error}</div>
          <div className="mt-2">
            <button onClick={handleBackToHome} className="button">
              {isPublicAccess ? "Go to Login" : "Back to Home"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container">
        <div className="card user-profile">
          <h1>User Not Found</h1>
          <p>The user with ID {id} could not be found.</p>
          <div className="mt-2">
            <button onClick={handleBackToHome} className="button">
              {isPublicAccess ? "Go to Login" : "Back to Home"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/user/${userData.id}`

  return (
    <div className="container">
      <div className="card user-profile">
        <h1>User Profile</h1>

        {isGuestPreview && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeeba",
              padding: "0.75rem",
              marginBottom: "1rem",
              borderRadius: "4px",
              color: "#856404",
            }}
          >
            <div className="flex justify-between align-center">
              <p style={{ margin: 0 }}>
                🔍 <strong>Admin Preview Mode:</strong> You're seeing exactly what guest users see.
              </p>
              <button onClick={exitGuestPreview} className="button button-secondary" style={{ fontSize: "0.875rem" }}>
                Exit Preview
              </button>
            </div>
          </div>
        )}

        {usedFallback && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeeba",
              padding: "0.75rem",
              marginBottom: "1rem",
              borderRadius: "4px",
              color: "#856404",
            }}
          >
            <p style={{ margin: 0 }}>⚠️ Using fallback data. There was an issue connecting to Google Sheets.</p>
          </div>
        )}

        {isPublicAccess && (
          <div
            style={{
              backgroundColor: "#e8f5e8",
              border: "1px solid #4caf50",
              padding: "0.75rem",
              marginBottom: "1rem",
              borderRadius: "4px",
            }}
          >
            <p style={{ margin: 0, color: "#2e7d32", fontSize: "0.875rem" }}>
              📱 <strong>Public Access:</strong> You're viewing this profile via QR code.{" "}
              <Link href="/login">Login</Link> for full system access.
            </p>
          </div>
        )}

        {isGuestUser && !isGuestPreview && !isPublicAccess && (
          <div
            style={{
              backgroundColor: "#f0f8ff",
              border: "1px solid #0066cc",
              padding: "0.75rem",
              marginBottom: "1rem",
              borderRadius: "4px",
            }}
          >
            <p style={{ margin: 0, color: "#0066cc", fontSize: "0.875rem" }}>
              👋 Viewing as guest user. <Link href="/login">Login as admin</Link> for full access.
            </p>
          </div>
        )}

        <div className="qr-container">
          <QRCode url={currentUrl} />
          <p>Scan to access this profile</p>
        </div>

        <UserProfile
          user={userData}
          isGuestView={shouldApplyGuestRestrictions}
          visibleColumns={displaySettings.visibleColumns}
          alwaysVisibleColumns={displaySettings.alwaysVisible}
        />

        <div className="mt-2">
          <button onClick={handleBackToHome} className="button">
            {isGuestPreview ? "Back to Admin Dashboard" : isPublicAccess ? "Go to Login" : "Back to Home"}
          </button>
          {isPublicAccess && (
            <Link href="/search" className="button button-secondary" style={{ marginLeft: "1rem" }}>
              Search More Users
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
