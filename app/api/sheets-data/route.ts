import { NextResponse } from "next/server"
import { getDisplaySettings } from "@/lib/display-settings"
import { getOrCreatePersistentId } from "@/lib/id-manager"

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
    id: "KH00001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 555-123-4567",
    address: "123 Main St, Anytown, USA",
    company: "Acme Inc",
    position: "Software Engineer",
  },
  {
    id: "KH00002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 555-987-6543",
    address: "456 Oak Ave, Somewhere, USA",
    company: "Tech Solutions",
    position: "Product Manager",
  },
  {
    id: "KH00003",
    name: "Robert Johnson",
    email: "robert.j@example.com",
    phone: "+1 555-456-7890",
    address: "789 Pine Rd, Nowhere, USA",
    company: "Global Systems",
    position: "Data Analyst",
  },
  {
    id: "KH00004",
    name: "Emily Davis",
    email: "emily.d@example.com",
    phone: "+1 555-789-0123",
    address: "321 Elm St, Everywhere, USA",
    company: "Creative Designs",
    position: "UX Designer",
  },
  {
    id: "KH00005",
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
  if (normalized.includes("email") || normalized.includes("mail")) return "email"
  if (normalized.includes("phone") || normalized.includes("mobile") || normalized.includes("tel")) return "phone"
  if (normalized.includes("address") || normalized.includes("location")) return "address"
  if (normalized.includes("company") || normalized.includes("organization")) return "company"
  if (normalized.includes("position") || normalized.includes("title") || normalized.includes("job")) return "position"

  return columnName
}

export async function GET(request: Request) {
  console.log("=== SHEETS-DATA API START ===")
  console.log("Sheet ID:", SHEET_ID ? "SET" : "NOT SET")
  console.log("API Key:", API_KEY ? "SET" : "NOT SET")

  // Return mock data if environment variables are not set
  if (!SHEET_ID || !API_KEY) {
    console.log("Environment variables missing, returning mock data")
    return NextResponse.json(MOCK_USERS, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  }

  try {
    // Get display settings
    const displaySettings = getDisplaySettings()
    const configuredIdColumn = displaySettings.idColumn
    console.log("Configured ID column:", configuredIdColumn || "Auto-generate")

    // Try the simplest possible approach - get all data from the first sheet
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:Z1000?key=${API_KEY}`
    console.log("Making request to Google Sheets...")

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "NextJS-GoogleSheets/1.0",
      },
    })

    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Google Sheets API error:", response.status, errorText)
      console.log("Falling back to mock data due to API error")
      return NextResponse.json(MOCK_USERS, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      })
    }

    const data = await response.json()
    const values = data.values || []
    console.log("Got", values.length, "rows from Google Sheets")

    if (values.length === 0) {
      console.log("No data in sheet, returning mock data")
      return NextResponse.json(MOCK_USERS, {
        headers: { "Cache-Control": "no-store, max-age=0" },
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
        headers: { "Cache-Control": "no-store, max-age=0" },
      })
    }

    // Find ID column index
    let idColumnIndex = -1
    if (configuredIdColumn) {
      idColumnIndex = headers.findIndex((header: string) => header === configuredIdColumn)
      console.log(`ID column "${configuredIdColumn}" found at index:`, idColumnIndex)
    }

    // Convert rows to users
    const users: User[] = rows.map((row: string[]) => {
      const user: User = { id: "" }

      // Map all columns
      headers.forEach((header: string, colIndex: number) => {
        if (colIndex >= row.length) return
        const value = row[colIndex] || ""
        if (!value.trim()) return

        const standardField = getStandardFieldName(header)
        user[standardField] = value
      })

      // Set ID
      let configuredId = ""
      if (configuredIdColumn && idColumnIndex >= 0 && idColumnIndex < row.length) {
        configuredId = row[idColumnIndex]?.trim() || ""
      }

      user.id = getOrCreatePersistentId(row, headers, configuredId)
      return user
    })

    // Filter valid users
    const validUsers = users.filter((user) => {
      const hasData = Object.values(user).some((value) => value && value.toString().trim() !== "")
      return hasData && user.id
    })

    console.log("Valid users:", validUsers.length)

    if (validUsers.length === 0) {
      console.log("No valid users found, returning mock data")
      return NextResponse.json(MOCK_USERS, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      })
    }

    console.log("=== SHEETS-DATA API SUCCESS ===")
    return NextResponse.json(validUsers, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  } catch (error) {
    console.error("Exception in sheets-data API:", error)
    console.log("Falling back to mock data due to exception")
    return NextResponse.json(MOCK_USERS, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  }
}
