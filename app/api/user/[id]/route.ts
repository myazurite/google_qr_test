import { NextResponse } from "next/server"
import { fetchUsers } from "@/lib/google-sheets"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const users = await fetchUsers()
    const user = users.find((u) => u.id === params.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
