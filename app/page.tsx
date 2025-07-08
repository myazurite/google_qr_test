"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  // @ts-ignore
  const { user, loading, isGuestMode } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/search")
        }
      } else if (isGuestMode) {
        router.push("/search")
      } else {
        router.push("/login")
      }
    }
  }, [user, loading, isGuestMode, router])

  return (
    <div className="container">
      <div className="card login-container">
        <h2>Loading...</h2>
      </div>
    </div>
  )
}
