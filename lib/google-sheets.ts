// Google Sheets API integration
import { fetchWithRetry } from "@/lib/fetch-with-retry"

export interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  [key: string]: string | undefined // Allow for any dynamic fields
}

// Detect whether we are executing in the browser or on the server
const isBrowser = typeof window !== "undefined"

// Mock data for development/fallback
const MOCK_USERS: User[] = [
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

async function fetchFromGoogleSheetsAPI(forceRefresh = false): Promise<User[]> {
  console.log("GS: Fetching data from Google Sheets API...", forceRefresh ? "(forced refresh)" : "")

  try {
    // Use multiple cache-busting parameters
    const params = new URLSearchParams({
      t: Date.now().toString(),
      r: Math.random().toString(36).slice(2),
      refresh: forceRefresh ? "1" : "0",
    })

    // Build the request URL:
    // – In the browser → relative path (same origin, avoids CORS)
    // – On the server  → absolute path (needs host)
    const baseUrl = isBrowser
      ? "" // same-origin
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    const url = `${baseUrl}/api/sheets-data?${params.toString()}`

    console.log("GS: Making request to:", url.replace(/[&?](t|r|refresh)=[^&]*/g, ""))

    const response = await fetchWithRetry(url, {
      retries: 2,
      timeout: 12_000,
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    console.log("GS: API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("GS: API error response:", errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("GS: Successfully fetched", data.length, "users from API")
    return data
  } catch (error) {
    console.error("GS: Error fetching from Google Sheets API:", error)
    throw error
  }
}

// Main function to fetch users (with fallback to mock data)
export async function fetchUsers(forceRefresh = false): Promise<User[]> {
  console.log("GS: fetchUsers called", forceRefresh ? "(forced refresh)" : "")

  try {
    // Try to fetch from Google Sheets via API route
    const users = await fetchFromGoogleSheetsAPI(forceRefresh)
    if (users && users.length > 0) {
      return users
    }
  } catch (error) {
    console.error("GS: Failed to fetch from Google Sheets API:", error)
    console.log("GS: Will fall back to mock data")
  }

  // Fallback to mock data
  console.log("GS: Using mock data as fallback")
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay
  return [...MOCK_USERS]
}

// Function to validate user data
export function validateUser(user: Partial<User>): boolean {
  return !!(user.id && (user.name || user.email))
}
