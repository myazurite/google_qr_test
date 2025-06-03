import { NextResponse } from "next/server"
import { getDisplaySettings, updateDisplaySettings } from "@/lib/display-settings"

export async function GET() {
  const settings = getDisplaySettings()
  return NextResponse.json({
    settings,
    success: true,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { visibleColumns, idColumn } = body

    if (visibleColumns !== undefined && !Array.isArray(visibleColumns)) {
      return NextResponse.json({ error: "visibleColumns must be an array" }, { status: 400 })
    }

    if (idColumn !== undefined && typeof idColumn !== "string") {
      return NextResponse.json({ error: "idColumn must be a string" }, { status: 400 })
    }

    // Update the settings
    const updateData: any = {}
    if (visibleColumns !== undefined) updateData.visibleColumns = visibleColumns
    if (idColumn !== undefined) updateData.idColumn = idColumn

    const updatedSettings = updateDisplaySettings(updateData)

    console.log("Display settings updated:", updatedSettings)

    return NextResponse.json({
      settings: updatedSettings,
      success: true,
      message: "Display settings updated successfully",
    })
  } catch (error) {
    console.error("Error updating display settings:", error)
    return NextResponse.json({ error: "Failed to update display settings" }, { status: 500 })
  }
}
