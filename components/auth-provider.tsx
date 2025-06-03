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
}

// Define auth context type
interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  getHomeRoute: () => string
}

// Create auth context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  getHomeRoute: () => "/",
})

// Mock users for demonstration
const MOCK_USERS = [
  { username: "admin", password: "admin123", role: "admin" as UserRole },
  { username: "guest", password: "guest123", role: "guest" as UserRole },
]

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/user/"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Function to get the appropriate home route based on user role
  const getHomeRoute = () => {
    if (!user) return "/login"
    return user.role === "admin" ? "/admin" : "/search"
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
    console.log("Auth: Current user:", user?.username, user?.role)

    // Don't redirect if we're on the login page
    if (pathname === "/login") {
      console.log("Auth: On login page, no redirect needed")
      return
    }

    // Check if current path is a public path
    const isPublicPath = PUBLIC_PATHS.some((publicPath) => pathname?.startsWith(publicPath))
    if (isPublicPath && user) {
      console.log("Auth: On public path with user, no redirect needed")
      return
    }

    // If no user and not on login page, redirect to login
    if (!user) {
      console.log("Auth: No user, redirecting to login")
      router.push("/login")
      return
    }

    // If user exists, handle role-based routing only for root path
    if (pathname === "/") {
      console.log("Auth: On root path, redirecting based on role")
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/search")
      }
    }

    // If user is not admin but trying to access admin pages
    if (pathname?.startsWith("/admin") && user.role !== "admin") {
      console.log("Auth: User is not admin but trying to access admin page, redirecting to search")
      router.push("/search")
    }
  }, [user, loading, pathname, router, isLoggingOut])

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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
