/** Period selection and comparison helpers for the API statistics page. */

export type StatsPeriod =
  | { mode: 'hours'; hours: number }
  | { mode: 'dates'; dateFrom: string; dateTo: string }

export type StatsPeriodParams = { hours: number } | { date_from: string; date_to: string }

export const MAX_RANGE_DAYS = 366

const DAY_MS = 24 * 60 * 60 * 1000

/** YYYY-MM-DD of a calendar date picked in the browser (local fields, no zone shift). */
export function localIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIsoDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid ISO date: ${value}`)
  const time = Date.parse(`${value}T00:00:00Z`)
  if (Number.isNaN(time)) throw new Error(`Invalid ISO date: ${value}`)
  return time
}

/** Inclusive number of calendar days in a date range. */
export function rangeDays(dateFrom: string, dateTo: string): number {
  return Math.round((parseIsoDate(dateTo) - parseIsoDate(dateFrom)) / DAY_MS) + 1
}

/**
 * Today's UTC date as a local-midnight Date, for the calendar's max selectable day:
 * the API refuses dates after the database's today (UTC on prod).
 */
export function utcTodayAsLocalDate(now: Date): Date {
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

/**
 * The last `days` calendar days ending today. Production statistics use UTC days,
 * so "today" is the UTC date of `now`.
 */
export function lastDaysPeriod(days: number, now: Date): StatsPeriod {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const iso = (time: number) => new Date(time).toISOString().slice(0, 10)
  return { mode: 'dates', dateFrom: iso(today - (days - 1) * DAY_MS), dateTo: iso(today) }
}

/** Custom range from a DatePicker range model; null until both ends are chosen. */
export function customRangePeriod(range: (Date | null)[] | null | undefined): StatsPeriod | null {
  const [start, end] = range ?? []
  if (!start || !end) return null
  const dateFrom = localIsoDate(start)
  const dateTo = localIsoDate(end)
  const days = rangeDays(dateFrom, dateTo)
  if (days < 1) throw new Error('Date range end is before its start')
  if (days > MAX_RANGE_DAYS) throw new Error(`Date range is longer than ${MAX_RANGE_DAYS} days`)
  return { mode: 'dates', dateFrom, dateTo }
}

export function periodToParams(period: StatsPeriod): StatsPeriodParams {
  if (period.mode === 'hours') return { hours: period.hours }
  return { date_from: period.dateFrom, date_to: period.dateTo }
}

/** Short length label used in "vs previous …". */
export function periodLengthLabel(period: StatsPeriod): string {
  if (period.mode === 'hours') return `${period.hours}h`
  return `${rangeDays(period.dateFrom, period.dateTo)}d`
}

export type DeltaTone = 'neutral' | 'good' | 'bad'

export interface DeltaView {
  text: string
  tone: DeltaTone
}

/**
 * Comparison with the previous period of equal length.
 * `higherIsWorse` marks metrics where growth is bad (errors, latency);
 * growth of the other metrics stays neutral.
 */
export function formatDelta(
  current: number | null,
  previous: number | null,
  lengthLabel: string,
  higherIsWorse: boolean,
): DeltaView {
  const prefix = `vs previous ${lengthLabel}:`
  if (current === null || previous === null) return { text: `${prefix} n/a`, tone: 'neutral' }
  if (current === previous) return { text: `${prefix} no change`, tone: 'neutral' }
  if (previous === 0) return { text: `${prefix} new`, tone: higherIsWorse ? 'bad' : 'neutral' }
  const pct = ((current - previous) / previous) * 100
  const arrow = pct > 0 ? '▲' : '▼'
  const up = pct > 0
  const tone: DeltaTone = higherIsWorse ? (up ? 'bad' : 'good') : 'neutral'
  return { text: `${prefix} ${arrow} ${Math.abs(pct).toFixed(0)}%`, tone }
}

const MAX_HOUR_TICKS = 8

/**
 * X-axis labels for an hourly series: every `step`-th bucket shows "HH:MM" (local time),
 * with the date as a second line on the first shown tick and whenever the day changes;
 * the other buckets get no label. `step` keeps the axis to at most eight ticks.
 */
export function hourTickLabels(bucketStarts: Date[]): (string | string[])[] {
  const step = Math.max(1, Math.ceil(bucketStarts.length / MAX_HOUR_TICKS))
  let previousDay: string | null = null
  return bucketStarts.map((start, index) => {
    if (index % step !== 0) return ''
    const time = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    const day = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    const label = day === previousDay ? time : [time, day]
    previousDay = day
    return label
  })
}

/** Average over a period, or null when it had no requests (the API reports 0 then). */
export function averageOrNull(average: number | null, requests: number | null): number | null {
  return requests === 0 ? null : average
}
