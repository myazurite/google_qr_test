"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import Header from "@/components/header"

export default function ConfigPage() {
  const [testResult, setTestResult] = useState("")
  const [testing, setTesting] = useState(false)
  const [envStatus, setEnvStatus] = useState<{
    hasApiKey: boolean
    hasSheetId: boolean
    apiKeyPreview: string
    sheetIdPreview: string
  }>({
    hasApiKey: false,
    hasSheetId: false,
    apiKeyPreview: "",
    sheetIdPreview: "",
  })
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      console.log("Config: No user, redirecting to login")
      router.push("/login")
      return
    }

    if (user.role !== "admin") {
      console.log("Config: User is not admin, redirecting to search")
      router.push("/search")
      return
    }

    console.log("Config: User is admin, loading config page")
  }, [user, router])

  useEffect(() => {
    // Check environment variables status
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        console.log("Config: Received env status:", data)
        setEnvStatus(data)
      })
      .catch((error) => {
        console.error("Config: Error fetching config status:", error)
      })
  }, [])

  const testConnection = async () => {
    setTesting(true)
    setTestResult("")

    try {
      console.log("Config: Testing Google Sheets connection")
      const response = await fetch("/api/test-sheets")
      const data = await response.json()
      console.log("Config: Test result:", data)

      if (data.success) {
        const { totalSheets, successfulSheets, sheetsWithData, totalDataRows, sheets } = data

        let resultMessage = `✅ Connection successful!\n`
        resultMessage += `📊 Found ${totalSheets} sheet(s), ${successfulSheets} accessible, ${sheetsWithData} with data\n`
        resultMessage += `📝 Total data rows: ${totalDataRows}\n\n`

        // Show details for each sheet
        sheets.forEach((sheet: any) => {
          if (sheet.success) {
            if (sheet.hasData) {
              resultMessage += `✅ "${sheet.name}": ${sheet.dataRowCount} data rows, headers: ${sheet.headers.join(", ")}\n`
            } else if (sheet.hasHeaders) {
              resultMessage += `⚠️ "${sheet.name}": Has headers (${sheet.headers.join(", ")}) but no data rows\n`
            } else {
              resultMessage += `❌ "${sheet.name}": Empty sheet\n`
            }
          } else {
            resultMessage += `❌ "${sheet.name}": Error - ${sheet.error}\n`
          }
        })

        if (sheetsWithData === 0) {
          resultMessage += `\n⚠️ No data found. Add some rows below your headers.`
        }

        setTestResult(resultMessage)
      } else {
        setTestResult(`❌ Connection failed: ${data.error}${data.details ? ` - ${data.details}` : ""}`)
      }
    } catch (error) {
      console.error("Config: Test error:", error)
      setTestResult(`❌ Connection failed: ${error}`)
    } finally {
      setTesting(false)
    }
  }

  const testSheetsData = async () => {
    setTesting(true)
    setTestResult("")

    try {
      console.log("Config: Testing sheets-data API")
      const response = await fetch("/api/sheets-data")
      const data = await response.json()
      console.log("Config: sheets-data result:", data)

      // Check if it's mock data
      const isMockData = data.some(
        (user: any) => user.id === "EMP001" && user.name === "John Doe" && user.email === "john.doe@example.com",
      )

      if (isMockData) {
        setTestResult(
          `⚠️ API returned mock data. This means your Google Sheets connection is working but there's no data in your sheet, or the data format is incorrect.`,
        )
      } else if (data.length === 0) {
        setTestResult(
          `✅ API connected to Google Sheets successfully, but no data rows found. Add some data to your sheet with Name, Email, and Phone columns.`,
        )
      } else {
        setTestResult(`✅ API returned real data! Found ${data.length} users from your Google Sheet.`)
      }
    } catch (error) {
      console.error("Config: sheets-data API error:", error)
      setTestResult(`❌ API test failed: ${error}`)
    } finally {
      setTesting(false)
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Header title="Google Sheets Configuration" onLogout={logout} showRefresh={false} />

      <div className="card">
        <h2>Google Sheets API Configuration</h2>
        <p className="mb-2">Configure your Google Sheets connection and test the data import.</p>

        <div className="button-group">
          <button onClick={testConnection} className="button button-secondary" disabled={testing}>
            {testing ? "Testing Connection..." : "Test Google Sheets Connection"}
          </button>
          <button onClick={testSheetsData} className="button" disabled={testing}>
            {testing ? "Testing API..." : "Test Sheets Data API"}
          </button>
          <Link href="/admin" className="button">
            Back to Dashboard
          </Link>
        </div>

        {testResult && <div className={`mt-2 ${testResult.includes("✅") ? "success" : "error"}`}>{testResult}</div>}
      </div>

      <div className="card">
        <h3>Environment Variables Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <strong>GOOGLE_SHEETS_API_KEY:</strong>
            <span className={envStatus.hasApiKey ? "success" : "error"}>
              {envStatus.hasApiKey ? `✅ Set (${envStatus.apiKeyPreview})` : "❌ Not Set"}
            </span>
          </div>
          <div className="status-item">
            <strong>GOOGLE_SHEET_ID:</strong>
            <span className={envStatus.hasSheetId ? "success" : "error"}>
              {envStatus.hasSheetId ? `✅ Set (${envStatus.sheetIdPreview})` : "❌ Not Set"}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Column Mapping</h3>
        <p>The system automatically maps common column names:</p>
        <ul>
          <li>
            <strong>Name:</strong> "Name", "Full Name" → name
          </li>
          <li>
            <strong>Email:</strong> "Email", "Mail" → email
          </li>
          <li>
            <strong>Phone:</strong> "Phone", "Mobile", "Tel" → phone
          </li>
          <li>
            <strong>ID:</strong> "ID", "User ID" → id (auto-generated if empty)
          </li>
          <li>
            <strong>Address:</strong> "Address", "Location" → address
          </li>
          <li>
            <strong>Company:</strong> "Company", "Organization" → company
          </li>
          <li>
            <strong>Position:</strong> "Position", "Title", "Job" → position
          </li>
        </ul>
        <p>
          <small>Other columns will be preserved with their original names.</small>
        </p>
      </div>

      <div className="card">
        <h3>Setup Instructions</h3>
        <ol>
          <li>
            ✅ Go to the{" "}
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
              Google Cloud Console
            </a>{" "}
            (Done)
          </li>
          <li>✅ Create a new project or select an existing one (Done)</li>
          <li>✅ Enable the Google Sheets API (Done)</li>
          <li>✅ Create credentials (API Key) (Done)</li>
          <li>✅ Copy your Sheet ID from the URL of your Google Sheet (Done)</li>
          <li>✅ Make sure your Google Sheet is publicly readable (Done)</li>
          <li>
            🔄 <strong>Add data rows to your Google Sheet</strong> (In Progress)
          </li>
        </ol>
      </div>
    </div>
  )
}
