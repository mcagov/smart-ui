import dotenv from 'dotenv'
import { contains, isBlank, isLocalUrl, isNotBlank } from '../src/utils'
dotenv.config()

describe('test utils', () => {
  it.each([
    [null, true],
    [undefined, true],
    ['', true],
    [' ', true],
    ['  ', true],
    ['  \n', true],
    ['  \t', true],
    ['  \r', true],
    ['text ', false],
    ['text', false]
  ])('check isBlank(%s) = %s', (str, result) => {
    expect(isBlank(str)).toBe(result)
  })

  it.each([
    [null, true],
    [undefined, true],
    ['', true],
    [' ', true],
    ['  ', true],
    ['  \n', true],
    ['  \t', true],
    ['  \r', true],
    ['text ', false],
    ['text', false]
  ])('check isNotBlank(%s) = %s', (str, result) => {
    expect(isNotBlank(str)).toBe(!result)
  })

  it.each([
    [null, '/callback', false],
    [undefined, '/callback', false],
    ['', '/callback', false],
    [' ', '/callback', false],
    ['callback ', '/callback', false],
    ['/callback ', '/callback', true],
    [' /signin//callback', '/callback', true],
    [' /callback', '/callback', true],
    ['/callback  \n', '/callback', true],
    ['/callback  \t', '/callback', true],
    ['/callback  \r', '/callback', true],
    ['/callback/callback ', '/callback', true]
  ])('check contains(%s, %s) = %s', (str, search, result) => {
    expect(contains(str, search)).toBe(result)
  })

  it.each([
    ['/', true],
    ['/trainees/abc', true],
    ['/trainees?page=2#top', true],
    [null, false],
    [undefined, false],
    ['', false],
    [['/trainees'], false],
    ['trainees/abc', false],
    ['//evil.example', false],
    ['/\\evil.example', false],
    ['https://evil.example', false],
    ['javascript:alert(1)', false],
    ['/trainees\\evil.example', false],
    ['/\t/evil.example', false],
    ['/trainees\r\nSet-Cookie: x=1', false],
    ['/trainees\x7F', false]
  ])('check isLocalUrl(%p) = %s', (url, result) => {
    expect(isLocalUrl(url)).toBe(result)
  })
})
