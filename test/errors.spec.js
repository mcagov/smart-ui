import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import createError from 'http-errors'

const mockWarn = jest.fn()
const mockError = jest.fn()

jest.unstable_mockModule('@mca/common-logger', () => ({
  __esModule: true,
  logger: { warn: mockWarn, error: mockError, info: jest.fn() }
}))

jest.unstable_mockModule('../src/config.js', () => ({
  __esModule: true,
  default: { features: { prettyErrors: false } }
}))

const { initialiseErrors } = await import('../src/errors.js')

describe('Unit tests for the error handlers', () => {
  let notFoundHandler, errorHandler, req, res, next

  beforeEach(() => {
    jest.clearAllMocks()

    const app = { use: jest.fn() }
    initialiseErrors(app)
    notFoundHandler = app.use.mock.calls[0][0]
    errorHandler = app.use.mock.calls[1][0]

    req = { originalUrl: '/robots.txt' }
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn()
    }
    next = jest.fn()
  })

  it('should forward unmatched paths to the error handler as a 404', () => {
    notFoundHandler(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }))
  })

  it('should log a 404 as a single warning, not an error', () => {
    errorHandler(createError(404), req, res, next)

    expect(mockWarn).toHaveBeenCalledWith('404 for /robots.txt')
    expect(mockError).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.render).toHaveBeenCalledWith('errors/404.html', expect.anything())
  })

  it('should still log a 500 as an error', () => {
    const err = new Error('boom')
    errorHandler(err, req, res, next)

    expect(mockError).toHaveBeenCalledWith(err)
    expect(mockWarn).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.render).toHaveBeenCalledWith('errors/500.html', expect.anything())
  })

  it('should flag a CSRF failure so the 403 page shows the session expired message', () => {
    const err = createError(403, 'invalid csrf token', { code: 'EBADCSRFTOKEN' })
    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.render).toHaveBeenCalledWith('errors/403.html', { error: err, csrfFailure: true })
  })

  it('should not flag a permissions 403 as a CSRF failure', () => {
    const err = createError(403, 'User 1 is not an admin')
    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.render).toHaveBeenCalledWith('errors/403.html', { error: err, csrfFailure: false })
  })
})
