// Simple in-memory store for persistent IDs
// In a real app, this would be stored in a database

interface IdMapping {
  [rowKey: string]: string // rowKey -> generated ID
}

let persistentIds: IdMapping = {}

// Function to generate a unique ID
function generateUniqueId(usedIds: Set<string>): string {
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    // Generate random 5-digit number
    const randomNum = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")
    const id = `KH${randomNum}`

    if (!usedIds.has(id)) {
      usedIds.add(id)
      return id
    }
    attempts++
  }

  // Fallback to timestamp-based ID if we can't find a unique random one
  const timestamp = Date.now().toString().slice(-5)
  const fallbackId = `KH${timestamp}`
  usedIds.add(fallbackId)
  return fallbackId
}

// Function to create a unique row key for persistence
function createRowKey(rowData: string[], headers: string[]): string {
  // Create a key based on the first few non-empty values to identify the row
  const keyParts: string[] = []

  for (let i = 0; i < Math.min(3, rowData.length); i++) {
    const value = rowData[i]?.trim()
    if (value) {
      keyParts.push(value)
    }
  }

  // If we don't have enough data, use the full row as key
  if (keyParts.length === 0) {
    return rowData.join("|").substring(0, 100) // Limit length
  }

  return keyParts.join("|")
}

// Function to get or create a persistent ID for a row
export function getOrCreatePersistentId(rowData: string[], headers: string[], configuredId?: string): string {
  // If we have a configured ID from the sheet, use it
  if (configuredId && configuredId.trim()) {
    return configuredId.trim()
  }

  // Create a unique key for this row
  const rowKey = createRowKey(rowData, headers)

  // Check if we already have an ID for this row
  if (persistentIds[rowKey]) {
    console.log(`ID Manager: Found existing ID for row: ${persistentIds[rowKey]}`)
    return persistentIds[rowKey]
  }

  // Get all currently used IDs
  const usedIds = new Set(Object.values(persistentIds))

  // Generate a new unique ID
  const newId = generateUniqueId(usedIds)

  // Store it for future use
  persistentIds[rowKey] = newId

  console.log(`ID Manager: Generated new persistent ID: ${newId} for row key: ${rowKey}`)
  return newId
}

// Function to get all stored IDs (for debugging)
export function getAllStoredIds(): IdMapping {
  return { ...persistentIds }
}

// Function to clear all stored IDs (for testing)
export function clearAllStoredIds(): void {
  persistentIds = {}
  console.log("ID Manager: Cleared all stored IDs")
}

// Function to get statistics
export function getIdStats() {
  return {
    totalStoredIds: Object.keys(persistentIds).length,
    storedIds: Object.values(persistentIds),
  }
}
