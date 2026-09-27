import { isAxiosError } from 'axios'

/**
 * The API's explanation of a rejected request (HTTP 422): a FastAPI `detail`
 * string or the messages of a validation error list. Null for any other failure.
 */
export function validationDetail(error: unknown): string | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null
  const detail: unknown = error.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map(item => (typeof item?.msg === 'string' ? item.msg : null))
      .filter((msg): msg is string => msg !== null)
    if (messages.length) return messages.join('; ')
  }
  return null
}
