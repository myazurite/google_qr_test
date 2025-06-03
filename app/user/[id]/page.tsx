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
  id: "KH00001",
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
  const { user, getHomeRoute } = useAuth()
  const homeRoute = getHomeRoute()

  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [displaySettings, setDisplaySettings] = useState<{
    visibleColumns: string[]
    alwaysVisible: string[]
  }>({
    visibleColumns: [],
    alwaysVisible: ["id"],
  })
  const [usedFallback, setUsedFallback] = useState(false)

  const isGuestUser = user?.role === "guest"

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

    if (user) {
      loadDisplaySettings()
    }
  }, [user])

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
          const isMockData = users.some(
            (u) => u.id === "KH00001" && u.name === "John Doe" && u.email === "john.doe@example.com",
          )

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

    if (id && user) {
      loadUser()
    }
  }, [id, user])

  if (!user) {
    return (
      <div className="container">
        <div className="card user-profile">
          <h1>Access Required</h1>
          <p>Please login to view this profile.</p>
          <div className="mt-2">
            <Link href="/login" className="button">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
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
            <Link href={homeRoute} className="button">
              Back to Dashboard
            </Link>
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
            <Link href={homeRoute} className="button">
              Back to Dashboard
            </Link>
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

        {isGuestUser && (
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
              👋 Viewing as guest user.
            </p>
          </div>
        )}

        <div className="qr-container">
          <QRCode url={currentUrl} />
          <p>Scan to access this profile</p>
        </div>

        <UserProfile
          user={userData}
          isGuestView={isGuestUser}
          visibleColumns={displaySettings.visibleColumns}
          alwaysVisibleColumns={displaySettings.alwaysVisible}
        />

        <div className="mt-2">
          <Link href={homeRoute} className="button">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
