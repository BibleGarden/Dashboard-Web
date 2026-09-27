import test from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { validationDetail } from '../src/utils/apiError.ts'

function axiosError(status, data) {
  return new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined,
    { status, data, statusText: '', headers: {}, config: {} })
}

test('422 detail string and validation list become a readable message', () => {
  assert.equal(validationDetail(axiosError(422, { detail: 'date_to is in the future' })), 'date_to is in the future')
  assert.equal(validationDetail(axiosError(422, { detail: [{ msg: 'a' }, { msg: 'b' }] })), 'a; b')
})

test('other failures have no validation detail', () => {
  assert.equal(validationDetail(axiosError(500, { detail: 'boom' })), null)
  assert.equal(validationDetail(new Error('network')), null)
})
