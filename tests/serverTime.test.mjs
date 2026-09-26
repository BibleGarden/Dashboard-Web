import test from 'node:test'
import assert from 'node:assert/strict'
import { parseServerTimestamp } from '../src/utils/serverTime.ts'

test('parses UTC and offset timestamps as the same instant', () => {
  assert.equal(parseServerTimestamp('2026-09-26T09:30:00Z').getTime(),
    parseServerTimestamp('2026-09-26T12:30:00+03:00').getTime())
})

test('refuses timestamps without an explicit zone or with an invalid date', () => {
  assert.throws(() => parseServerTimestamp('2026-09-26T09:30:00'), /no time zone/)
  assert.throws(() => parseServerTimestamp('not-a-dateZ'), /Invalid server timestamp/)
})
