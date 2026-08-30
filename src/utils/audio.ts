import { requireApiKey } from '../config/api'

/**
 * Creates URL with API key for audio files
 * Since HTML Audio element doesn't support custom headers,
 * we add API key as query parameter
 *
 * NOTE: This only works if API supports API key in query parameters
 */
export function createAudioUrlWithAuth(url: string): string {
  if (!url) return url

  // Check if this is an audio URL
  if (!url.includes('/audio/')) {
    return url
  }

  // Add API key as query parameter (throws if not configured)
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}api_key=${encodeURIComponent(requireApiKey())}`
}

/**
 * Performs fetch request with API key in header
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)

  // Add API key for public endpoints (throws if not configured)
  if (url.includes('/audio/')) {
    headers.set('X-API-Key', requireApiKey())
  }

  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Loads audio file with authorization and creates Blob URL
 * 
 * WARNING: This is a temporary solution with drawbacks:
 * - Loads entire file into memory
 * - Streaming doesn't work
 * - High memory consumption
 * 
 * Use only if API doesn't support API key in query parameters
 */
export async function createAuthenticatedAudioBlob(url: string): Promise<string> {
  try {
    const response = await fetchWithAuth(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    
    return blobUrl
  } catch (error) {
    console.error('Error loading audio with authorization:', error)
    throw error
  }
}

/**
 * Cleans up Blob URL to free memory
 */
export function revokeBlobUrl(blobUrl: string): void {
  if (blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl)
  }
}
