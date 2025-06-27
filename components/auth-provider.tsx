"use client"

import type React from "react"

import { createContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

// Define user roles
export type UserRole = "admin" | "guest"

// Define user type
export interface AuthUser {
  username: string
  role: UserRole
  isPreviewMode?: boolean // New flag for preview mode
}

// Define auth context type
interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  getHomeRoute: () => string
  enterGuestPreview: () => void
  exitGuestPreview: () => void
  isGuestPreview: boolean
}

// Create auth context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  getHomeRoute: () => "/",
  enterGuestPreview: () => {},
  exitGuestPreview: () => {},
  isGuestPreview: false,
})

// Mock users for demonstration
const MOCK_USERS = [
  { username: "admin", password: "Longnvh.2110", role: "admin" as UserRole },
  { username: "guest", password: "guest123", role: "guest" as UserRole },
]

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/user/"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [originalUser, setOriginalUser] = useState<AuthUser | null>(null) // Store original admin user
  const router = useRouter()
  const pathname = usePathname()

  // Check if currently in guest preview mode
  const isGuestPreview = user?.isPreviewMode === true

  // Function to get the appropriate home route based on user role
  const getHomeRoute = () => {
    if (!user) return "/login"
    if (isGuestPreview) return "/search"
    return user.role === "admin" ? "/admin" : "/search"
  }

  // Function to enter guest preview mode
  const enterGuestPreview = () => {
    if (user && user.role === "admin" && !isGuestPreview) {
      console.log("Auth: Entering guest preview mode")
      setOriginalUser(user) // Store the original admin user
      setUser({
        username: "guest_preview",
        role: "guest",
        isPreviewMode: true,
      })
      // Navigate to search page to simulate guest experience
      router.push("/search")
    }
  }

  // Function to exit guest preview mode
  const exitGuestPreview = () => {
    if (isGuestPreview && originalUser) {
      console.log("Auth: Exiting guest preview mode")
      setUser(originalUser) // Restore the original admin user
      setOriginalUser(null)
      // Navigate back to admin dashboard
      router.push("/admin")
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    console.log("Auth: Checking for stored user")

    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log("Auth: Found stored user:", parsedUser.username, parsedUser.role)
        setUser(parsedUser)
      } catch (e) {
        console.error("Auth: Error parsing stored user:", e)
        localStorage.removeItem("user")
      }
    } else {
      console.log("Auth: No stored user found")
    }
    setLoading(false)
  }, [])

  // Handle navigation based on auth state
  useEffect(() => {
    if (loading || isLoggingOut) return

    console.log("Auth: Navigation check for path:", pathname)
    console.log("Auth: Current user:", user?.username, user?.role, "Preview mode:", isGuestPreview)

    // Don't redirect if we're on the login page
    if (pathname === "/login") {
      console.log("Auth: On login page, no redirect needed")
      return
    }

    // Check if current path is a public path (like /user/1, /user/2, etc.)
    const isPublicPath = PUBLIC_PATHS.some((publicPath) => pathname?.startsWith(publicPath))
    if (isPublicPath) {
      console.log("Auth: On public path, allowing access without authentication")
      return
    }

    // If no user and not on login page and not on public path, redirect to login
    if (!user) {
      console.log("Auth: No user, redirecting to login")
      router.push("/login")
      return
    }

    // If user exists, handle role-based routing only for root path
    if (pathname === "/") {
      console.log("Auth: On root path, redirecting based on role")
      if (isGuestPreview || user.role === "guest") {
        router.push("/search")
      } else if (user.role === "admin") {
        router.push("/admin")
      }
    }

    // If user is in guest preview mode but trying to access admin pages
    if (pathname?.startsWith("/admin") && isGuestPreview) {
      console.log("Auth: Guest preview mode trying to access admin page, redirecting to search")
      router.push("/search")
    }

    // If user is not admin (and not in preview mode) but trying to access admin pages
    if (pathname?.startsWith("/admin") && user.role !== "admin" && !isGuestPreview) {
      console.log("Auth: User is not admin but trying to access admin page, redirecting to search")
      router.push("/search")
    }
  }, [user, loading, pathname, router, isLoggingOut, isGuestPreview])

  // Login function
  const login = async (username: string, password: string) => {
    console.log("Auth: Login attempt for:", username)
    const foundUser = MOCK_USERS.find((u) => u.username === username && u.password === password)

    if (!foundUser) {
      console.log("Auth: Login failed - invalid credentials")
      throw new Error("Invalid credentials")
    }

    const authUser = {
      username: foundUser.username,
      role: foundUser.role,
    }

    console.log("Auth: Login successful for:", authUser.username, authUser.role)

    setUser(authUser)
    localStorage.setItem("user", JSON.stringify(authUser))

    // Redirect based on role
    if (foundUser.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/search")
    }
  }

  // Logout function - simplified to prevent flashing
  const logout = () => {
    console.log("Auth: Logging out user:", user?.username)

    setIsLoggingOut(true)

    // Clear auth state
    setUser(null)
    setOriginalUser(null) // Clear preview mode state
    localStorage.removeItem("user")

    console.log("Auth: Cleared auth state, redirecting to login")

    // Use replace instead of push to prevent back navigation
    router.replace("/login")

    // Reset logout state after a short delay
    setTimeout(() => {
      setIsLoggingOut(false)
    }, 100)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        getHomeRoute,
        enterGuestPreview,
        exitGuestPreview,
        isGuestPreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
