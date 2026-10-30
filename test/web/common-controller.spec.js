import { jest, describe, it, expect } from '@jest/globals'

const { handleRedirect } = await import('../../src/controllers/common.js')

describe('handleRedirect', () => {
  const defaultPage = '/training-providers/tp-1'

  it.each([
    ['/trainees/abc/details', '/trainees/abc/details'],
    ['/training-providers?page=2', '/training-providers?page=2'],
    [undefined, defaultPage],
    ['', defaultPage],
    ['https://evil.example', defaultPage],
    ['//evil.example', defaultPage],
    ['/\\evil.example', defaultPage],
    ['javascript:alert(1)', defaultPage],
    ['trainees/abc', defaultPage],
    [['/trainees', '//evil.example'], defaultPage]
  ])('redirects return=%p to %p', (returnParam, expected) => {
    const res = { redirect: jest.fn() }

    handleRedirect(res, returnParam, defaultPage)

    expect(res.redirect).toHaveBeenCalledWith(expected)
  })
})
