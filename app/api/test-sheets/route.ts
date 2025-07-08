import { NextResponse } from "next/server"

export async function GET() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

  console.log("Test API: Checking environment variables...")
  console.log("Test API: SHEET_ID exists:", !!SHEET_ID)
  console.log("Test API: API_KEY exists:", !!API_KEY)

  if (!SHEET_ID || !API_KEY) {
    return NextResponse.json(
      {
        error: "Missing environment variables",
        details: {
          hasSheetId: !!SHEET_ID,
          hasApiKey: !!API_KEY,
          sheetIdPreview: SHEET_ID ? `${SHEET_ID.substring(0, 8)}...` : "Not set",
          apiKeyPreview: API_KEY ? `${API_KEY.substring(0, 8)}...` : "Not set",
        },
      },
      { status: 400 },
    )
  }

  try {
    // Add cache busting to prevent caching issues
    const timestamp = Date.now()

    // First, get the spreadsheet metadata to see all available sheets
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}&_=${timestamp}`
    console.log("Test API: Getting spreadsheet metadata...")

    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text()
      console.error("Test API: Metadata error response:", errorText)
      return NextResponse.json(
        {
          error: `Google Sheets API error: ${metadataResponse.status}`,
          details: errorText,
        },
        { status: metadataResponse.status },
      )
    }

    const metadata = await metadataResponse.json()
    const sheets = metadata.sheets || []
    const sheetNames = sheets.map((sheet: any) => sheet.properties.title)

    console.log("Test API: Found sheets:", sheetNames)

    if (sheetNames.length === 0) {
      return NextResponse.json(
        {
          error: "No sheets found in the spreadsheet",
          details: "The spreadsheet appears to be empty or inaccessible",
        },
        { status: 404 },
      )
    }

    // Test each sheet
    const sheetResults = []
    for (const sheetName of sheetNames) {
      try {
        const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}&_=${timestamp}`
        console.log(`Test API: Testing sheet: ${sheetName}`)

        const dataResponse = await fetch(dataUrl, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (dataResponse.ok) {
          const data = await dataResponse.json()
          const values = data.values || []
          const headers = values.length > 0 ? values[0] : []
          const dataRows = values.length > 1 ? values.slice(1) : []

          // Safely handle headers
          const headersList = Array.isArray(headers) ? headers.filter((h) => h && h.toString().trim()) : []

          sheetResults.push({
            name: sheetName,
            success: true,
            rowCount: values.length,
            dataRowCount: dataRows.length,
            headers: headersList,
            headerCount: headersList.length,
            sampleData: values.slice(0, 3),
            isEmpty: values.length === 0,
            hasHeaders: headersList.length > 0,
            hasData: dataRows.length > 0,
          })
        } else {
          const errorText = await dataResponse.text()
          sheetResults.push({
            name: sheetName,
            success: false,
            error: `${dataResponse.status}: ${errorText}`,
          })
        }
      } catch (sheetError) {
        sheetResults.push({
          name: sheetName,
          success: false,
          error: String(sheetError),
        })
      }
    }

    const successfulSheets = sheetResults.filter((s) => s.success)
    const sheetsWithData = sheetResults.filter((s) => s.success && s.hasData)
    const totalRows = successfulSheets.reduce((sum, sheet) => sum + (sheet.rowCount || 0), 0)
    const totalDataRows = successfulSheets.reduce((sum, sheet) => sum + (sheet.dataRowCount || 0), 0)

    return NextResponse.json({
      success: true,
      spreadsheetTitle: metadata.properties?.title || "Unknown",
      totalSheets: sheetNames.length,
      successfulSheets: successfulSheets.length,
      sheetsWithData: sheetsWithData.length,
      totalRows: totalRows,
      totalDataRows: totalDataRows,
      sheets: sheetResults,
      message: `Successfully connected! Found ${successfulSheets.length}/${sheetNames.length} accessible sheets with ${totalDataRows} data rows.`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test API: Exception:", error)
    return NextResponse.json(
      {
        error: "Failed to connect to Google Sheets",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
