import { NextResponse } from "next/server"
import { getDisplaySettings } from "@/lib/display-settings"

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

interface User {
  id: string
  [key: string]: string | undefined
}

// Mock data for fallback
const MOCK_USERS = [
  {
    id: "EMP001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 555-123-4567",
    address: "123 Main St, Anytown, USA",
    company: "Acme Inc",
    position: "Software Engineer",
  },
  {
    id: "EMP002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 555-987-6543",
    address: "456 Oak Ave, Somewhere, USA",
    company: "Tech Solutions",
    position: "Product Manager",
  },
  {
    id: "EMP003",
    name: "Robert Johnson",
    email: "robert.j@example.com",
    phone: "+1 555-456-7890",
    address: "789 Pine Rd, Nowhere, USA",
    company: "Global Systems",
    position: "Data Analyst",
  },
  {
    id: "EMP004",
    name: "Emily Davis",
    email: "emily.d@example.com",
    phone: "+1 555-789-0123",
    address: "321 Elm St, Everywhere, USA",
    company: "Creative Designs",
    position: "UX Designer",
  },
  {
    id: "EMP005",
    name: "Michael Wilson",
    email: "michael.w@example.com",
    phone: "+1 555-234-5678",
    address: "654 Maple Dr, Anywhere, USA",
    company: "Data Corp",
    position: "CTO",
  },
]

function normalizeColumnName(columnName: string): string {
  return columnName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "")
}

function getStandardFieldName(columnName: string): string {
  const normalized = normalizeColumnName(columnName)

  if (normalized.includes("name") || normalized.includes("fullname")) return "name"
  if (normalized.includes("email")) return "email"
  if (normalized.includes("phone") || normalized.includes("mobile") || normalized.includes("tel")) return "phone"
  if (normalized.includes("address") || normalized.includes("location")) return "address"
  if (normalized.includes("company") || normalized.includes("organization")) return "company"
  if (normalized.includes("position") || normalized.includes("title") || normalized.includes("job")) return "position"

  return columnName
}

// Safely turn any cell value into a trimmed string
function toTrimmedString(val: unknown): string {
  return typeof val === "string" ? val.trim() : val !== undefined && val !== null ? String(val).trim() : ""
}

export async function GET(request: Request) {
  console.log("=== SHEETS-DATA API START ===")

  const url = new URL(request.url)
  const forceRefresh = url.searchParams.get("refresh") === "1"

  console.log("Force refresh:", forceRefresh)
  console.log("Sheet ID:", SHEET_ID ? "SET" : "NOT SET")
  console.log("API Key:", API_KEY ? "SET" : "NOT SET")

  // Return mock data if environment variables are not set
  if (!SHEET_ID || !API_KEY) {
    console.log("Environment variables missing, returning mock data")
    return NextResponse.json(MOCK_USERS, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  try {
    // Get display settings
    const displaySettings = getDisplaySettings()
    console.log("Display settings:", displaySettings)

    const majorDimension = "ROWS"
    const valueRender = "UNFORMATTED_VALUE"
    const dateTimeRenderOption = forceRefresh ? "FORMATTED_STRING" : "SERIAL_NUMBER"

    const sheetsUrlBase = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:Z1000`
    const sheetsUrl =
      `${sheetsUrlBase}?key=${API_KEY}` +
      `&majorDimension=${majorDimension}` +
      `&valueRenderOption=${valueRender}` +
      `&dateTimeRenderOption=${dateTimeRenderOption}`

    console.log("Making request to Google Sheets…")

    const response = await fetch(sheetsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "NextJS-GoogleSheets/1.0",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Google Sheets API error:", response.status, errorText)
      console.log("Falling back to mock data due to API error")
      return NextResponse.json(MOCK_USERS, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    const data = await response.json()
    const values = data.values || []
    console.log("Got", values.length, "rows from Google Sheets")

    if (values.length === 0) {
      console.log("No data in sheet, returning mock data")
      return NextResponse.json(MOCK_USERS, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    // Process the data
    const headers = values[0] || []
    const rows = values.slice(1)
    console.log("Headers:", headers)
    console.log("Data rows:", rows.length)

    if (headers.length === 0 || rows.length === 0) {
      console.log("No headers or data rows, returning mock data")
      return NextResponse.json(MOCK_USERS, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    // Find ID column (case insensitive)
    let idColumnIndex = -1
    const idColumnNames = ["id", "user id", "userid", "user_id", "employee id", "emp id", "empid"]

    for (let i = 0; i < headers.length; i++) {
      const headerLower = headers[i].toLowerCase().trim()
      if (idColumnNames.includes(headerLower)) {
        idColumnIndex = i
        console.log(`Found ID column "${headers[i]}" at index ${i}`)
        break
      }
    }

    if (idColumnIndex === -1) {
      console.log("No ID column found in headers:", headers)
      console.log("Falling back to mock data")
      return NextResponse.json(MOCK_USERS, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    const users: User[] = []
    const usedIds = new Set<string>()

    // Convert rows to users
    rows.forEach((row: string[], rowIndex: number) => {
      const user: User = { id: "" }

      // Get ID from the ID column
      let userId = ""
      if (idColumnIndex < row.length) {
        const rawId = row[idColumnIndex]
        userId = toTrimmedString(rawId)
      }

      // Skip rows without ID or with duplicate IDs
      if (!userId) {
        console.log(`Row ${rowIndex + 2} skipped: no ID`)
        return
      }

      if (usedIds.has(userId)) {
        console.log(`Row ${rowIndex + 2} skipped: duplicate ID "${userId}"`)
        return
      }

      usedIds.add(userId)
      user.id = userId

      // Map all other columns
      headers.forEach((header: string, colIndex: number) => {
        // Skip the ID column as we've already processed it
        if (colIndex === idColumnIndex) return

        // Ignore entirely-empty trailing cells
        if (colIndex >= row.length) return

        const raw = row[colIndex]
        const valueStr = toTrimmedString(raw)

        // Skip empty values
        if (!valueStr) return

        const standardField = getStandardFieldName(header)
        user[standardField] = valueStr
      })

      // Only add users with some data beyond just the ID
      const hasAdditionalData = Object.keys(user).length > 1
      if (hasAdditionalData) {
        users.push(user)
      } else {
        console.log(`User with ID "${userId}" skipped: no additional data`)
      }
    })

    console.log("Valid users:", users.length)

    if (users.length === 0) {
      console.log("No valid users found, returning mock data")
      return NextResponse.json(MOCK_USERS, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    console.log("=== SHEETS-DATA API SUCCESS ===")
    return NextResponse.json(users, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Exception in sheets-data API:", error)
    console.log("Falling back to mock data due to exception")
    return NextResponse.json(MOCK_USERS, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }
}
