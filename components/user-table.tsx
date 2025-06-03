import Link from "next/link"
import type { User } from "@/lib/google-sheets"

interface UserTableProps {
  users: User[]
}

export default function UserTable({ users }: UserTableProps) {
  // Check if this is mock data by looking for the specific mock user
  const isMockData = users.some(
    (user) => user.id === "KH00001" && user.name === "John Doe" && user.email === "john.doe@example.com",
  )

  // Get all unique column names from all users
  const allColumns = new Set<string>()
  users.forEach((user) => {
    Object.keys(user).forEach((key) => {
      if (key !== "id") {
        allColumns.add(key)
      }
    })
  })

  // Convert to array and sort, prioritizing common fields
  const priorityFields = ["name", "email", "phone", "company", "address", "position"]
  const sortedColumns = Array.from(allColumns).sort((a, b) => {
    const aIndex = priorityFields.indexOf(a.toLowerCase())
    const bIndex = priorityFields.indexOf(b.toLowerCase())

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })

  // Limit to first 5 columns for table display
  const displayColumns = sortedColumns.slice(0, 5)

  // Function to format column headers
  const formatHeader = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  return (
    <div className="card">
      <div className="flex justify-between align-center">
        <h2>User List ({users.length})</h2>
        <div>
          {isMockData ? (
            <span className="error" style={{ fontSize: "0.875rem" }}>
              📋 Using mock data - Configure Google Sheets for real data
            </span>
          ) : (
            <span className="success" style={{ fontSize: "0.875rem" }}>
              ✅ Using Google Sheets data
            </span>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="error">No users found. Please check your Google Sheets configuration.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                {displayColumns.map((column) => (
                  <th key={column}>{formatHeader(column)}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  {displayColumns.map((column) => (
                    <td key={column}>{user[column] || "-"}</td>
                  ))}
                  <td>
                    <Link href={`/user/${user.id}`} className="button">
                      Export QR
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedColumns.length > 5 && (
            <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.5rem" }}>
              Showing {displayColumns.length} of {sortedColumns.length} columns. View individual profiles for complete
              information.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
