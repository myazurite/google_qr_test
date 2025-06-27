"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log("Login: User already authenticated, redirecting")
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/search")
      }
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(username, password)
      // Redirect will happen automatically via the auth provider
    } catch (err) {
      setError("Invalid username or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    console.log("Login: Guest login clicked - auto-filling credentials")
    setUsername("guest")
    setPassword("guest123")
    setError("")
    setIsLoading(true)

    try {
      await login("guest", "guest123")
      // Redirect will happen automatically via the auth provider
    } catch (err) {
      setError("Guest login failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state if already authenticated
  if (user) {
    return (
      <div className="container">
        <div className="card login-container">
          <h2>Redirecting...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card login-container">
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ margin: "1.5rem 0", textAlign: "center", color: "#666" }}>
          <hr style={{ margin: "1rem 0" }} />
          <span>or</span>
        </div>

        <button
          onClick={handleGuestLogin}
          className="button button-secondary"
          style={{ width: "100%" }}
          disabled={isLoading}
        >
          {isLoading ? "Logging in as guest..." : "Continue as Guest"}
        </button>

        <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#666", textAlign: "center" }}>
          <p>
            <strong>Admin Login:</strong> admin / admin123
          </p>
          <p>
            <strong>Guest Login:</strong> guest / guest123
          </p>
          <p>
            <strong>Or click "Continue as Guest" for quick access</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
