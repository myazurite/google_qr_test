/**
 * Utility for making fetch requests with retry logic
 */

interface FetchWithRetryOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  retries?: number
  retryDelay?: number
  timeout?: number
}

export async function fetchWithRetry(url: string, options: FetchWithRetryOptions = {}): Promise<Response> {
  const { method = "GET", headers = {}, body, retries = 3, retryDelay = 1000, timeout = 10000 } = options

  let lastError: Error | null = null

  // Try the request multiple times
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt + 1}/${retries + 1} for: ${url.replace(/key=([^&]+)/, "key=***API_KEY***")}`)

      // Create an AbortController to handle timeouts
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Make the fetch request
      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          // Add cache-busting headers
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      // Clear the timeout
      clearTimeout(timeoutId)

      // Return the response if successful
      return response
    } catch (error) {
      lastError = error as Error
      console.error(`Fetch attempt ${attempt + 1} failed:`, error)

      // Check if we've reached max retries
      if (attempt >= retries) {
        console.error(`All ${retries + 1} fetch attempts failed`)
        break
      }

      // Check if it's an abort error (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        console.log(`Request timed out after ${timeout}ms, retrying...`)
      }

      // Wait before retrying
      console.log(`Waiting ${retryDelay}ms before retry...`)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error(`Failed to fetch after ${retries + 1} attempts`)
}
