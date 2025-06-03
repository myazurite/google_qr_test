// Google Sheets API integration
import { fetchWithRetry } from "@/lib/fetch-with-retry"

export interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  [key: string]: string | undefined // Allow for any dynamic fields
}

// Mock data for development/fallback
const MOCK_USERS: User[] = [
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

// Function to fetch data from Google Sheets via API route
async function fetchFromGoogleSheetsAPI(): Promise<User[]> {
  console.log("GS: Fetching data from Google Sheets API...")

  try {
    // Use a timestamp to prevent caching
    const timestamp = new Date().getTime()
    const randomParam = Math.random()
    const url = `/api/sheets-data?t=${timestamp}&r=${randomParam}`

    console.log("GS: Making request to:", url)

    const response = await fetchWithRetry(url, {
      retries: 2,
      timeout: 8000,
      headers: {
        Accept: "application/json",
      },
    })

    console.log("GS: API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("GS: API error response:", errorText)

      // Try to parse error details
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { error: errorText }
      }

      throw new Error(`API error: ${response.status} - ${errorData.error || errorText}`)
    }

    const data = await response.json()
    console.log("GS: Successfully fetched data from API:", data.length, "users")

    // Check if the data looks like our mock data
    const isMockData = data.some(
      (user: User) => user.id === "KH00001" && user.name === "John Doe" && user.email === "john.doe@example.com",
    )

    if (isMockData) {
      console.log("GS: WARNING - Data appears to be mock data")
    } else {
      console.log("GS: Data appears to be from Google Sheets")
    }

    return data
  } catch (error) {
    console.error("GS: Error fetching from Google Sheets API:", error)

    // Provide more context about the error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to the API. Please check your internet connection.")
    }

    throw error
  }
}

// Main function to fetch users (with fallback to mock data)
export async function fetchUsers(): Promise<User[]> {
  console.log("GS: fetchUsers called")

  try {
    // Try to fetch from Google Sheets via API route
    const users = await fetchFromGoogleSheetsAPI()
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

// Function to generate a new user ID
export function generateUserId(rowNumber: number): string {
  return `KH${rowNumber.toString().padStart(5, "0")}`
}

// Function to validate user data
export function validateUser(user: Partial<User>): boolean {
  return !!user.id
}
