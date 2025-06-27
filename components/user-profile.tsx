import type {User} from "@/lib/google-sheets"

interface UserProfileProps {
  user: User
  isGuestView: boolean
  visibleColumns?: string[]
  alwaysVisibleColumns?: string[]
}

export default function UserProfile({
  user,
  isGuestView,
  visibleColumns = [],
  alwaysVisibleColumns = ["id"],
}: UserProfileProps) {
  // Function to check if a field should be visible
  const isFieldVisible = (key: string): boolean => {
    // Admin sees everything
    if (!isGuestView) return true

    // For guests, check visibility settings
    return alwaysVisibleColumns.includes(key) || visibleColumns.includes(key)
  }

  // Create entries from user properties that should be visible
  const entries = Object.entries(user).filter(
    ([key, value]) =>
      // Must have a value and be visible according to settings
      value && value.toString().trim() !== "" && isFieldVisible(key),
  )

  // Function to format field names nicely
  const formatFieldName = (key: string): string => {
    // Special case for ID
    if (key === "id") return "ID"

    // Handle common abbreviations and formats
    return key
        .replace(/([A-Z])/g, " $1") // Add space before capital letters
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
        .replace(/\b\w/g, (str) => str.toUpperCase()) // Capitalize each word
        .trim()
  }

  // Debug logging for guest view

  return (
    <div>
      <h2>{user.name || user.id}</h2>

      {/* Debug info for admins */}
      {!isGuestView && (
        <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>
          <strong>Admin View:</strong> Showing all fields. Guest users see only:{" "}
          {alwaysVisibleColumns.concat(visibleColumns).join(", ")}
        </div>
      )}

      {/* Debug info for guests */}
      {/*{isGuestView && (*/}
      {/*  <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>*/}
      {/*    <strong>Guest View:</strong> Showing {entries.length} visible fields*/}
      {/*  </div>*/}
      {/*)}*/}

      <div className="card">
        <h3>User Information</h3>
        {entries.length > 0 ? (
          <table className="table">
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key}>
                  <td>
                    <strong>{formatFieldName(key)}</strong>
                  </td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>
            <p>No information available to display.</p>
            {isGuestView && (
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Contact an administrator to configure what information is visible to guests.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
