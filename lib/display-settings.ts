// Simple in-memory store for display settings
// In a real app, this would be stored in a database

let displaySettings = {
  visibleColumns: ["Họ và tên đệm", "Email liên hệ", "Số điện thoại"],
  alwaysVisible: ["Họ và tên đệm", "Email liên hệ"],
}

export function getDisplaySettings() {
  return { ...displaySettings }
}

export function updateDisplaySettings(newSettings: Partial<typeof displaySettings>) {
  displaySettings = { ...displaySettings, ...newSettings }
  console.log("Display settings updated to:", displaySettings)
  return { ...displaySettings }
}

export function resetDisplaySettings() {
  displaySettings = {
    visibleColumns: ["name"],
    alwaysVisible: ["id"],
  }
  return { ...displaySettings }
}

// Function to check if a column should be visible to guests
export function isColumnVisibleToGuests(columnName: string): boolean {
  const settings = getDisplaySettings()
  const isVisible = settings.alwaysVisible.includes(columnName) || settings.visibleColumns.includes(columnName)
  return isVisible
}

// Function to get all available columns from user data
export function getAvailableColumns(users: any[]): string[] {
  const allColumns = new Set<string>()

  users.forEach((user) => {
    Object.keys(user).forEach((key) => {
      allColumns.add(key)
    })
  })

  // Convert to array and sort, prioritizing common fields
  const priorityFields = ["id", "name", "email", "phone", "company", "address", "position"]
  const sortedColumns = Array.from(allColumns).sort((a, b) => {
    const aIndex = priorityFields.indexOf(a.toLowerCase())
    const bIndex = priorityFields.indexOf(b.toLowerCase())

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })

  return sortedColumns
}
