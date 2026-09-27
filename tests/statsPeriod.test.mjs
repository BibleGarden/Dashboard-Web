import test from 'node:test'
import assert from 'node:assert/strict'
import {
  averageOrNull,
  customRangePeriod,
  hourTickLabels,
  formatDelta,
  lastDaysPeriod,
  periodLengthLabel,
  periodToParams,
  rangeDays,
  utcTodayAsLocalDate,
} from '../src/utils/statsPeriod.ts'

test('maps hour and date periods to exclusive query parameter sets', () => {
  assert.deepEqual(periodToParams({ mode: 'hours', hours: 24 }), { hours: 24 })
  assert.deepEqual(periodToParams({ mode: 'dates', dateFrom: '2026-09-01', dateTo: '2026-09-27' }),
    { date_from: '2026-09-01', date_to: '2026-09-27' })
})

test('last N days ends on the UTC date of now, inclusive', () => {
  // 01:30 in Moscow on Sep 28 is still Sep 27 in UTC.
  const now = new Date('2026-09-27T22:30:00Z')
  assert.deepEqual(lastDaysPeriod(7, now), { mode: 'dates', dateFrom: '2026-09-21', dateTo: '2026-09-27' })
  assert.equal(rangeDays('2026-09-21', '2026-09-27'), 7)
})

test('custom range waits for both ends and keeps picked calendar dates', () => {
  assert.equal(customRangePeriod(null), null)
  assert.equal(customRangePeriod([new Date(2026, 8, 1), null]), null)
  assert.deepEqual(customRangePeriod([new Date(2026, 8, 1), new Date(2026, 8, 1)]),
    { mode: 'dates', dateFrom: '2026-09-01', dateTo: '2026-09-01' })
})

test('custom range refuses spans over 366 days', () => {
  assert.ok(customRangePeriod([new Date(2025, 0, 1), new Date(2026, 0, 1)]))
  assert.throws(() => customRangePeriod([new Date(2025, 0, 1), new Date(2026, 0, 2)]), /longer than 366 days/)
})

test('period length labels', () => {
  assert.equal(periodLengthLabel({ mode: 'hours', hours: 24 }), '24h')
  assert.equal(periodLengthLabel({ mode: 'dates', dateFrom: '2026-08-29', dateTo: '2026-09-27' }), '30d')
})

test('delta text and tone against the previous period', () => {
  assert.deepEqual(formatDelta(150, 100, '24h', false), { text: 'vs previous 24h: ▲ 50%', tone: 'neutral' })
  assert.deepEqual(formatDelta(150, 100, '24h', true), { text: 'vs previous 24h: ▲ 50%', tone: 'bad' })
  assert.deepEqual(formatDelta(50, 100, '7d', true), { text: 'vs previous 7d: ▼ 50%', tone: 'good' })
  assert.deepEqual(formatDelta(3, 3, '7d', true), { text: 'vs previous 7d: no change', tone: 'neutral' })
  assert.deepEqual(formatDelta(2, 0, '7d', true), { text: 'vs previous 7d: new', tone: 'bad' })
  assert.deepEqual(formatDelta(2, null, '7d', true), { text: 'vs previous 7d: n/a', tone: 'neutral' })
  assert.deepEqual(formatDelta(null, 2, '7d', true), { text: 'vs previous 7d: n/a', tone: 'neutral' })
})

test('calendar max date is the UTC day, expressed as a local date', () => {
  const max = utcTodayAsLocalDate(new Date('2026-09-27T22:30:00Z'))
  assert.deepEqual([max.getFullYear(), max.getMonth(), max.getDate()], [2026, 8, 27])
})

test('hourly ticks show HH:MM and the date on the first tick and on day change', () => {
  const start = new Date(2026, 8, 27, 20, 0)
  const hours = Array.from({ length: 9 }, (_, i) => new Date(start.getTime() + i * 3600_000))
  const day = date => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  // 9 buckets → step 2: 20:00, 22:00, 00:00 (new day), 02:00, 04:00
  assert.deepEqual(hourTickLabels(hours),
    [['20:00', day(hours[0])], '', '22:00', '', ['00:00', day(hours[4])], '', '02:00', '', '04:00'])
})

test('average is unknown for a period without requests', () => {
  assert.equal(averageOrNull(0, 0), null)
  assert.equal(averageOrNull(120, 5), 120)
  assert.equal(averageOrNull(120, null), 120)
})
