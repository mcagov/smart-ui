import { jest, describe, it, expect, beforeEach } from '@jest/globals'

const mockCacheGet = jest.fn()
const mockCachePut = jest.fn()
const mockCacheDel = jest.fn()
const mockAgent = {}
let mockResponseBody

// A superagent request: chainable, resolving to the response body set by the test
const mockRequest = () => {
  const request = {
    set: () => request,
    query: () => request,
    send: () => request,
    then: (resolve, reject) => Promise.resolve({ body: mockResponseBody }).then(resolve, reject)
  }
  return request
}

jest.unstable_mockModule('../../src/app.js', () => ({
  __esModule: true,
  cache: { get: mockCacheGet, put: mockCachePut, del: mockCacheDel }
}))

jest.unstable_mockModule('superagent', () => ({
  __esModule: true,
  default: mockAgent
}))

const { default: TraineeRetention } = await import('../../src/services/trainee-retention.mjs')

describe('Unit tests for the trainee retention service', () => {
  const summary = { needsReview: 412, reviewed: 60, retained: 21, total: 493, dueAtNextRun: 37, needsReviewDueAtNextRun: 5, nextRunDate: '2026-11-01' }
  let service

  beforeEach(() => {
    ['get', 'post', 'put', 'delete'].forEach((method) => { mockAgent[method] = jest.fn(mockRequest) })
    mockResponseBody = undefined
    mockCacheGet.mockResolvedValue(undefined)
    mockCachePut.mockResolvedValue('OK')
    mockCacheDel.mockResolvedValue(1)
    service = new TraineeRetention()
  })

  describe('summary', () => {
    it('should return the cached summary without calling the API', async () => {
      mockCacheGet.mockResolvedValue(summary)

      expect(await service.summary('token')).toEqual(summary)
      expect(mockCacheGet).toHaveBeenCalledWith('TraineeRetention', 'summary')
      expect(mockAgent.get).not.toHaveBeenCalled()
    })

    it('should call the API and cache the summary for five minutes when it is not cached', async () => {
      mockResponseBody = summary

      expect(await service.summary('token')).toEqual(summary)
      expect(mockAgent.get).toHaveBeenCalledWith(expect.stringMatching(/\/candidates\/summary$/))
      expect(mockCachePut).toHaveBeenCalledWith('TraineeRetention', 'summary', summary, 300)
    })

    it('should call the API when the cache cannot be read or written', async () => {
      mockCacheGet.mockRejectedValue(new Error('redis down'))
      mockCachePut.mockRejectedValue(new Error('redis down'))
      mockResponseBody = summary

      expect(await service.summary('token')).toEqual(summary)
      expect(mockAgent.get).toHaveBeenCalled()
    })
  })

  describe('changes clear the cached summary', () => {
    it.each([
      ['create', (s) => s.create('token', { traineeId: 't1' }), 'post'],
      ['put', (s) => s.put('token', 't1', { traineeId: 't1' }), 'put'],
      ['del', (s) => s.del('token', 't1'), 'delete'],
      ['createReview', (s) => s.createReview('token', { traineeId: 't1' }), 'post'],
      ['deleteReview', (s) => s.deleteReview('token', 't1'), 'delete']
    ])('%s should call the API, then clear the cached summary', async (name, call, method) => {
      mockResponseBody = { id: 't1' }

      expect(await call(service)).toEqual({ id: 't1' })
      expect(mockAgent[method]).toHaveBeenCalled()
      expect(mockCacheDel).toHaveBeenCalledWith('TraineeRetention', 'summary')
    })

    it('should not clear the cached summary when the API call fails', async () => {
      mockAgent.post = jest.fn(() => {
        const request = mockRequest()
        request.then = (resolve, reject) => Promise.reject(new Error('400')).then(resolve, reject)
        return request
      })

      await expect(service.createReview('token', { traineeId: 't1' })).rejects.toThrow('400')
      expect(mockCacheDel).not.toHaveBeenCalled()
    })

    it('should still succeed when the cached summary cannot be cleared', async () => {
      mockCacheDel.mockRejectedValue(new Error('redis down'))
      mockResponseBody = { id: 't1' }

      expect(await service.del('token', 't1')).toEqual({ id: 't1' })
    })
  })
})
