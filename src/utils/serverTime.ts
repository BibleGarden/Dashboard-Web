/** Server instants must carry their UTC suffix or an explicit offset. */
export function parseServerTimestamp(value: string): Date {
  const normalized = value.replace(' ', 'T')
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(normalized)) {
    throw new Error('Server timestamp has no time zone')
  }
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid server timestamp')
  }
  return date
}
