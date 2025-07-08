import { NextResponse } from "next/server"
import { fetchUsers } from "@/lib/google-sheets"

export async function GET() {
  try {
    console.log("API route: Fetching users...")
    const users = await fetchUsers()
    console.log("API route: Successfully fetched", users.length, "users")

    return NextResponse.json(users, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
