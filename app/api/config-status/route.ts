import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  const sheetId = process.env.GOOGLE_SHEET_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  console.log("Config Status API: Checking environment variables")
  console.log("Config Status API: GOOGLE_SHEETS_API_KEY exists:", !!apiKey)
  console.log("Config Status API: GOOGLE_SHEET_ID exists:", !!sheetId)
  console.log("Config Status API: NEXT_PUBLIC_BASE_URL:", baseUrl || "Not set")

  return NextResponse.json({
    hasApiKey: !!apiKey,
    hasSheetId: !!sheetId,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "",
    sheetIdPreview: sheetId ? `${sheetId.substring(0, 4)}...${sheetId.substring(sheetId.length - 4)}` : "",
    baseUrl: baseUrl || "Not set",
  })
}
