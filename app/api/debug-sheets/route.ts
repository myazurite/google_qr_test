import { NextResponse } from "next/server"

export async function GET() {
  console.log("=== GOOGLE SHEETS DEBUG START ===")

  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      hasSheetId: !!SHEET_ID,
      hasApiKey: !!API_KEY,
      hasBaseUrl: !!BASE_URL,
      sheetIdLength: SHEET_ID?.length || 0,
      apiKeyLength: API_KEY?.length || 0,
      sheetIdPreview: SHEET_ID ? `${SHEET_ID.substring(0, 8)}...${SHEET_ID.substring(SHEET_ID.length - 8)}` : "NOT SET",
      apiKeyPreview: API_KEY ? `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}` : "NOT SET",
      baseUrl: BASE_URL || "NOT SET",
    },
    tests: [] as any[],
  }

  console.log("Debug Info - Environment:", debugInfo.environment)

  // Test 1: Check if environment variables are set
  if (!SHEET_ID || !API_KEY) {
    debugInfo.tests.push({
      test: "Environment Variables",
      status: "FAILED",
      error: "Missing required environment variables",
      details: {
        missingSheetId: !SHEET_ID,
        missingApiKey: !API_KEY,
      },
    })

    console.log("=== GOOGLE SHEETS DEBUG END (ENV VARS MISSING) ===")
    return NextResponse.json(debugInfo)
  }

  // Test 2: Basic Google Sheets API connectivity
  try {
    console.log("Testing basic Google Sheets API connectivity...")
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`

    console.log("Making request to:", metadataUrl.replace(API_KEY, "***API_KEY***"))

    const metadataResponse = await fetch(metadataUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "NextJS-App/1.0",
      },
    })

    console.log("Metadata response status:", metadataResponse.status)
    console.log("Metadata response headers:", Object.fromEntries(metadataResponse.headers.entries()))

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text()
      console.error("Metadata error response:", errorText)

      debugInfo.tests.push({
        test: "Basic API Connectivity",
        status: "FAILED",
        error: `HTTP ${metadataResponse.status}`,
        details: {
          status: metadataResponse.status,
          statusText: metadataResponse.statusText,
          errorBody: errorText,
          headers: Object.fromEntries(metadataResponse.headers.entries()),
        },
      })
    } else {
      const metadata = await metadataResponse.json()
      console.log("Successfully got metadata:", metadata.properties?.title)

      debugInfo.tests.push({
        test: "Basic API Connectivity",
        status: "PASSED",
        details: {
          spreadsheetTitle: metadata.properties?.title,
          totalSheets: metadata.sheets?.length || 0,
          sheetNames: metadata.sheets?.map((s: any) => s.properties.title) || [],
        },
      })

      // Test 3: Try to fetch data from each sheet
      const sheets = metadata.sheets || []
      for (const sheet of sheets) {
        const sheetName = sheet.properties.title
        console.log(`Testing data fetch from sheet: ${sheetName}`)

        try {
          const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`
          console.log("Data URL:", dataUrl.replace(API_KEY, "***API_KEY***"))

          const dataResponse = await fetch(dataUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": "NextJS-App/1.0",
            },
          })

          console.log(`Sheet ${sheetName} response status:`, dataResponse.status)

          if (!dataResponse.ok) {
            const errorText = await dataResponse.text()
            console.error(`Sheet ${sheetName} error:`, errorText)

            debugInfo.tests.push({
              test: `Data Fetch - ${sheetName}`,
              status: "FAILED",
              error: `HTTP ${dataResponse.status}`,
              details: {
                status: dataResponse.status,
                statusText: dataResponse.statusText,
                errorBody: errorText,
              },
            })
          } else {
            const data = await dataResponse.json()
            const values = data.values || []
            console.log(`Sheet ${sheetName} data:`, values.length, "rows")

            debugInfo.tests.push({
              test: `Data Fetch - ${sheetName}`,
              status: "PASSED",
              details: {
                totalRows: values.length,
                hasHeaders: values.length > 0,
                headers: values.length > 0 ? values[0] : [],
                dataRows: values.length > 1 ? values.length - 1 : 0,
                sampleData: values.slice(0, 3),
              },
            })
          }
        } catch (fetchError) {
          console.error(`Exception fetching from sheet ${sheetName}:`, fetchError)
          debugInfo.tests.push({
            test: `Data Fetch - ${sheetName}`,
            status: "EXCEPTION",
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            details: {
              errorType: fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError,
            },
          })
        }
      }
    }
  } catch (error) {
    console.error("Exception in basic connectivity test:", error)
    debugInfo.tests.push({
      test: "Basic API Connectivity",
      status: "EXCEPTION",
      error: error instanceof Error ? error.message : String(error),
      details: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      },
    })
  }

  // Test 4: Test our internal API route
  try {
    console.log("Testing internal API route...")
    const internalResponse = await fetch(`${BASE_URL || "http://localhost:3000"}/api/sheets-data`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    console.log("Internal API response status:", internalResponse.status)

    if (!internalResponse.ok) {
      const errorText = await internalResponse.text()
      console.error("Internal API error:", errorText)

      debugInfo.tests.push({
        test: "Internal API Route",
        status: "FAILED",
        error: `HTTP ${internalResponse.status}`,
        details: {
          status: internalResponse.status,
          errorBody: errorText,
        },
      })
    } else {
      const data = await internalResponse.json()
      console.log("Internal API data:", data.length, "users")

      // Check if it's mock data
      const isMockData = data.some(
        (user: any) => user.id === "KH00001" && user.name === "John Doe" && user.email === "john.doe@example.com",
      )

      debugInfo.tests.push({
        test: "Internal API Route",
        status: "PASSED",
        details: {
          userCount: data.length,
          isMockData: isMockData,
          sampleUser: data[0] || null,
        },
      })
    }
  } catch (error) {
    console.error("Exception testing internal API:", error)
    debugInfo.tests.push({
      test: "Internal API Route",
      status: "EXCEPTION",
      error: error instanceof Error ? error.message : String(error),
    })
  }

  console.log("=== GOOGLE SHEETS DEBUG END ===")
  return NextResponse.json(debugInfo)
}
