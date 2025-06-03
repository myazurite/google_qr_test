import { NextResponse } from "next/server"
import { getAllStoredIds, clearAllStoredIds, getIdStats } from "@/lib/id-manager"

export async function GET() {
  const stats = getIdStats()
  const allIds = getAllStoredIds()

  return NextResponse.json({
    success: true,
    stats,
    allIds,
  })
}

export async function DELETE() {
  clearAllStoredIds()

  return NextResponse.json({
    success: true,
    message: "All stored IDs cleared",
  })
}
