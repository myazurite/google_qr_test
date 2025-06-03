import type { User } from "@/lib/google-sheets"

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
    if (key === "id") return "USER ID"

    // Handle common abbreviations and formats
    const formatted = key
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .replace(/\b\w/g, (str) => str.toUpperCase()) // Capitalize each word
      .trim()

    return formatted
  }

  return (
    <div>
      <h2>{user.name || user.id}</h2>
      <p className="mb-2">USER ID: {user.id}</p>

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
          <p>No additional information available.</p>
        )}
      </div>
    </div>
  )
}
