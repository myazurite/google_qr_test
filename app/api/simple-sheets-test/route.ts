import { NextResponse } from "next/server"

export async function GET() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

  console.log("=== SIMPLE SHEETS TEST ===")
  console.log("Sheet ID exists:", !!SHEET_ID)
  console.log("API Key exists:", !!API_KEY)

  if (!SHEET_ID || !API_KEY) {
    return NextResponse.json({
      success: false,
      error: "Missing environment variables",
      hasSheetId: !!SHEET_ID,
      hasApiKey: !!API_KEY,
    })
  }

  try {
    // Try the most basic request possible
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:Z1000?key=${API_KEY}`
    console.log("Making simple request to Google Sheets...")
    console.log("URL (masked):", url.replace(API_KEY, "***"))

    const response = await fetch(url)
    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Error response:", errorText)
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: errorText,
      })
    }

    const data = await response.json()
    console.log("Success! Got data with", data.values?.length || 0, "rows")

    return NextResponse.json({
      success: true,
      rowCount: data.values?.length || 0,
      headers: data.values?.[0] || [],
      sampleData: data.values?.slice(0, 5) || [],
      range: data.range || "Unknown",
    })
  } catch (error) {
    console.error("Exception:", error)
    return NextResponse.json({
      success: false,
      error: "Exception occurred",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
