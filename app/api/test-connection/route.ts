import { NextResponse } from "next/server"
import { fetchWithRetry } from "@/lib/fetch-with-retry"

export async function GET() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

  console.log("Test Connection: Starting comprehensive test...")

  if (!SHEET_ID || !API_KEY) {
    return NextResponse.json({
      success: false,
      error: "Missing environment variables",
      details: {
        hasSheetId: !!SHEET_ID,
        hasApiKey: !!API_KEY,
      },
    })
  }

  try {
    // Test 1: Basic connectivity to Google Sheets API
    console.log("Test Connection: Testing basic API connectivity...")
    const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`

    const testResponse = await fetchWithRetry(testUrl, {
      retries: 2,
      timeout: 8000,
      headers: {
        Accept: "application/json",
      },
    })

    console.log("Test Connection: Basic API response status:", testResponse.status)

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error("Test Connection: Basic API error:", errorText)

      return NextResponse.json({
        success: false,
        error: `Google Sheets API error: ${testResponse.status}`,
        details: errorText,
        step: "Basic API connectivity",
      })
    }

    const metadata = await testResponse.json()
    console.log("Test Connection: Successfully connected to Google Sheets API")

    // Test 2: Get sheet information
    const sheets = metadata.sheets || []
    const sheetNames = sheets.map((sheet: any) => sheet.properties.title)

    console.log("Test Connection: Found sheets:", sheetNames)

    if (sheetNames.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No sheets found in the spreadsheet",
        details: "The spreadsheet appears to be empty",
        step: "Sheet enumeration",
      })
    }

    // Test 3: Try to fetch data from the first sheet
    const firstSheet = sheetNames[0]
    console.log("Test Connection: Testing data fetch from first sheet:", firstSheet)

    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(firstSheet)}?key=${API_KEY}`

    const dataResponse = await fetchWithRetry(dataUrl, {
      retries: 2,
      timeout: 8000,
      headers: {
        Accept: "application/json",
      },
    })

    console.log("Test Connection: Data fetch response status:", dataResponse.status)

    if (!dataResponse.ok) {
      const errorText = await dataResponse.text()
      console.error("Test Connection: Data fetch error:", errorText)

      return NextResponse.json({
        success: false,
        error: `Failed to fetch data from sheet "${firstSheet}": ${dataResponse.status}`,
        details: errorText,
        step: "Data fetch",
        availableSheets: sheetNames,
      })
    }

    const data = await dataResponse.json()
    const values = data.values || []

    console.log("Test Connection: Successfully fetched data, rows:", values.length)

    return NextResponse.json({
      success: true,
      message: "All tests passed successfully!",
      details: {
        spreadsheetTitle: metadata.properties?.title || "Unknown",
        totalSheets: sheetNames.length,
        availableSheets: sheetNames,
        firstSheetData: {
          name: firstSheet,
          totalRows: values.length,
          hasHeaders: values.length > 0,
          headers: values.length > 0 ? values[0] : [],
          sampleData: values.slice(0, 3),
        },
      },
    })
  } catch (error) {
    console.error("Test Connection: Exception occurred:", error)

    return NextResponse.json({
      success: false,
      error: "Connection test failed with exception",
      details: error instanceof Error ? error.message : String(error),
      step: "Exception handling",
    })
  }
}
