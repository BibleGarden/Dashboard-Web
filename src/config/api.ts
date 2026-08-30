/**
 * API Configuration
 *
 * The API key is used for read endpoints of the admin API,
 * JWT tokens are used for administrative endpoints (modifying data).
 *
 * There is NO fallback for a missing API key: an unset or empty
 * VITE_ADMIN_API_KEY is a configuration error reported explicitly at startup
 * (see src/main.ts). Working without the header would make a broken
 * configuration look like a 403 coming from the server.
 */

/** Name of the environment variable holding the admin API key. */
const API_KEY_ENV_VAR = 'VITE_ADMIN_API_KEY'

export const API_CONFIG = {
  // Base URLs for APIs — dev-server proxy prefixes, see vite.config.js.
  // ADMIN_API_URL points at the admin API (Dashboard-API); the public
  // bible-api is not used by this dashboard at all.
  ADMIN_API_URL: '/admin-api',
  ALIGNMENT_API_URL: '/alignment-api',
}

/** Thrown when the frontend is started without a usable API configuration. */
export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiConfigError'
  }
}

/**
 * Single point of reading the admin API key out of the environment.
 * Returns the trimmed key, or null if it is missing/empty.
 */
function readApiKey(): string | null {
  const raw = import.meta.env.VITE_ADMIN_API_KEY
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed === '' ? null : trimmed
}

function apiConfigError(): ApiConfigError {
  return new ApiConfigError(
    `${API_KEY_ENV_VAR} is not set (or is empty). ` +
      'The dashboard cannot authenticate against the admin API without it. ' +
      `Set ${API_KEY_ENV_VAR} in Dashboard-Web/.env for the dev container ` +
      '(dashboard-web, port 9086) or in the environment of the ' +
      'dashboard-web-prod container (root .env, port 9087), then restart the container.'
  )
}

/**
 * Validate the API configuration, throwing an ApiConfigError that names the
 * offending variable. Called once at startup, before the app is mounted.
 */
export function assertApiConfigured(): void {
  if (readApiKey() === null) {
    throw apiConfigError()
  }
}

/**
 * Return the configured (trimmed) API key. Throws instead of returning an
 * empty string, so no request is ever sent silently without the X-API-Key
 * header.
 */
export function requireApiKey(): string {
  const key = readApiKey()
  if (key === null) {
    throw apiConfigError()
  }
  return key
}

/**
 * Public endpoints requiring only API key
 */
export const PUBLIC_ENDPOINTS = [
  '/languages',
  '/translations',
  '/translation_info',
  '/books',
  '/chapter_with_alignment',
  '/excerpt_with_alignment',
  '/audio/',
]

/**
 * Administrative endpoints requiring JWT token
 */
export const ADMIN_ENDPOINTS = [
  '/voices/',
  '/anomalies',
  '/manual-fixes',
  '/check_translation',
  '/check_voice',
  '/stats/',
]

/**
 * Check if endpoint is public
 */
export function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint))
}

/**
 * Check if endpoint is administrative
 */
export function isAdminEndpoint(url: string): boolean {
  return ADMIN_ENDPOINTS.some(endpoint => url.includes(endpoint))
}
