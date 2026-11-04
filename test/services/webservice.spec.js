import { describe, it, expect } from '@jest/globals'
import WebService from '../../src/services/webservice.js'

describe('WebService.urlFor', () => {
  const service = new WebService('http://api.local/v1/trainees')

  it.each([
    [['abc-123'], 'http://api.local/v1/trainees/abc-123'],
    [[42, 'status', 'Active'], 'http://api.local/v1/trainees/42/status/Active'],
    [['2024', 3], 'http://api.local/v1/trainees/2024/3'],
    [['../admin'], 'http://api.local/v1/trainees/..%2Fadmin'],
    [['abc/claims'], 'http://api.local/v1/trainees/abc%2Fclaims'],
    [['abc?role=admin'], 'http://api.local/v1/trainees/abc%3Frole%3Dadmin'],
    [['abc#fragment'], 'http://api.local/v1/trainees/abc%23fragment'],
    [['a b'], 'http://api.local/v1/trainees/a%20b']
  ])('builds the url for segments %p as %s', (segments, expected) => {
    expect(service.urlFor(...segments)).toBe(expected)
  })

  it('returns the base url when there are no segments', () => {
    expect(service.urlFor()).toBe('http://api.local/v1/trainees')
  })
})
