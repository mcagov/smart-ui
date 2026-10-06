import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import moment from 'moment'

const mockCandidates = jest.fn()
const mockSummary = jest.fn()
const mockGet = jest.fn()
const mockCreate = jest.fn()
const mockPut = jest.fn()
const mockDel = jest.fn()
const mockGetReview = jest.fn()
const mockCreateReview = jest.fn()
const mockDeleteReview = jest.fn()
const mockValidationResult = jest.fn()
const mockGetAllByLogin = jest.fn()

// The controller picks Okta or local users depending on the auth mode, so mock both the same way
const mockUsers = () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ getAllByLogin: mockGetAllByLogin }))
})
jest.unstable_mockModule('../../src/services/okta.users.js', mockUsers)
jest.unstable_mockModule('../../src/services/local.users.js', mockUsers)

jest.unstable_mockModule('../../src/services/trainee-retention.mjs', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    candidates: mockCandidates,
    summary: mockSummary,
    get: mockGet,
    create: mockCreate,
    put: mockPut,
    del: mockDel,
    getReview: mockGetReview,
    createReview: mockCreateReview,
    deleteReview: mockDeleteReview
  }))
}))

jest.unstable_mockModule('express-validator', () => ({
  __esModule: true,
  validationResult: mockValidationResult
}))

const {
  list,
  setReturnUrl,
  getOverride,
  getReview,
  getNextRunDate,
  setRetainDefaults,
  retain,
  review,
  removeRetention,
  undoReview
} = await import('../../src/controllers/trainee-retention-review.mjs')

const apiError = (status, message) => ({ status, response: { body: { message } } })

describe('Unit tests for the trainee retention review controller', () => {
  let req, res, next

  const summary = { needsReview: 412, reviewed: 60, retained: 21, total: 493, dueAtNextRun: 37, nextRunDate: '2026-11-01' }
  const returnUrl = '/trainee-retention-review?reviewStatus=Retained&page=2'

  beforeEach(() => {
    jest.clearAllMocks()
    mockCandidates.mockResolvedValue({ data: [], meta: { totalPages: 0, thisPage: 1 } })
    mockSummary.mockResolvedValue(summary)
    mockValidationResult.mockReturnValue({ isEmpty: () => true, errors: [] })
    mockGetAllByLogin.mockResolvedValue([])

    req = {
      params: {},
      query: {},
      body: {},
      session: { passport: { user: { tokens: { access_token: 'test-token' } } } }
    }
    res = {
      locals: {},
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      render: jest.fn()
    }
    next = jest.fn()
  })

  describe('list()', () => {
    it('should default to the needs review tab sorted by last active date', async () => {
      await list(req, res, next)

      expect(mockCandidates).toHaveBeenCalledWith('test-token', {
        page: 1,
        limit: 10,
        sort: 'lastActiveDate',
        order: 'asc',
        reviewStatus: 'NeedsReview'
      })
      expect(res.locals.reviewStatus).toBe('NeedsReview')
      expect(next).toHaveBeenCalledWith()
    })

    it('should default to the needs review tab when the review status is not recognised', async () => {
      req.query.reviewStatus = 'Deleted'

      await list(req, res, next)

      expect(mockCandidates.mock.calls[0][1]).toHaveProperty('reviewStatus', 'NeedsReview')
      expect(res.locals.reviewStatus).toBe('NeedsReview')
    })

    it('should count the trainees due at the next run that need review, ignoring the filters', async () => {
      req.query = { reviewStatus: 'Retained', trainingProviderId: 'tp-1', searchText: 'Kieran' }
      mockCandidates
        .mockResolvedValueOnce({ data: [], meta: { totalPages: 0, thisPage: 1 } })
        .mockResolvedValueOnce({ data: [{}], meta: { totalPages: 5, thisPage: 1, totalItems: 5 } })

      await list(req, res, next)

      expect(mockCandidates).toHaveBeenNthCalledWith(2, 'test-token', {
        reviewStatus: 'NeedsReview',
        dueAtNextRun: true,
        page: 1,
        limit: 1
      })
      expect(res.locals.dueNotReviewed).toBe(5)
    })

    it('should not send a review status to the API for the all tab', async () => {
      req.query.reviewStatus = 'All'

      await list(req, res, next)

      expect(mockCandidates.mock.calls[0][1]).not.toHaveProperty('reviewStatus')
      expect(res.locals.reviewStatus).toBe('All')
    })

    it('should map the filters to the API query parameters', async () => {
      req.query = {
        reviewStatus: 'Retained',
        trainingProviderId: 'tp-1',
        searchText: '  Kieran ',
        dueAtNextRun: 'true'
      }

      await list(req, res, next)

      expect(mockCandidates).toHaveBeenCalledWith('test-token', expect.objectContaining({
        reviewStatus: 'Retained',
        trainingProviderId: 'tp-1',
        contactName: 'Kieran',
        dueAtNextRun: true
      }))
    })

    it('should not filter on due at next run unless it is ticked', async () => {
      req.query.dueAtNextRun = 'false'

      await list(req, res, next)

      expect(mockCandidates.mock.calls[0][1]).not.toHaveProperty('dueAtNextRun')
    })

    it('should set the candidates, summary, return url and the filters carried across the tabs', async () => {
      req.query = { reviewStatus: 'Reviewed', page: 2, trainingProviderId: 'tp-1', searchText: 'Kieran' }
      req.originalUrl = '/trainee-retention-review?reviewStatus=Reviewed&page=2&trainingProviderId=tp-1&searchText=Kieran'

      await list(req, res, next)

      expect(res.locals.returnUrl).toBe(req.originalUrl)
      expect(res.locals.summary).toEqual(summary)
      expect(res.locals.candidates.meta.queries).toEqual({ reviewStatus: 'Reviewed', trainingProviderId: 'tp-1', searchText: 'Kieran' })
      expect(res.locals.filterQuery).toBe('trainingProviderId=tp-1&searchText=Kieran')
    })

    it('should pass API errors to next', async () => {
      mockSummary.mockRejectedValue({ status: 403, message: 'Forbidden' })

      await list(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }))
    })

    it('should look up the names of who reviewed the trainees on the reviewed tab', async () => {
      req.query.reviewStatus = 'Reviewed'
      mockCandidates.mockResolvedValueOnce({
        data: [
          { id: 't1', reviewedBy: 'mca.ab@service.dev.smart.mcga.uk' },
          { id: 't2', reviewedBy: 'MCA.AB@service.dev.smart.mcga.uk' },
          { id: 't3', reviewedBy: '0oa1clientid' }
        ],
        meta: { totalPages: 1, thisPage: 1 }
      })
      mockGetAllByLogin.mockResolvedValue([
        { profile: { firstName: 'mca', lastName: 'ab', email: 'mca.ab@service.dev.smart.mcga.uk' } }
      ])

      await list(req, res, next)

      expect(mockGetAllByLogin).toHaveBeenCalledWith(
        ['mca.ab@service.dev.smart.mcga.uk', 'MCA.AB@service.dev.smart.mcga.uk', '0oa1clientid'])
      expect(res.locals.candidates.data.map((c) => c.reviewedByName)).toEqual(['mca ab', 'mca ab', undefined])
      expect(next).toHaveBeenCalledWith()
    })

    it('should not look up names on the other tabs', async () => {
      req.query.reviewStatus = 'All'

      await list(req, res, next)

      expect(mockGetAllByLogin).not.toHaveBeenCalled()
    })

    it('should still show the list without names when the user lookup fails', async () => {
      req.query.reviewStatus = 'Reviewed'
      mockCandidates.mockResolvedValueOnce({
        data: [{ id: 't1', reviewedBy: 'mca.ab@service.dev.smart.mcga.uk' }],
        meta: { totalPages: 1, thisPage: 1 }
      })
      mockGetAllByLogin.mockRejectedValue(new Error('Okta is down'))

      await list(req, res, next)

      expect(res.locals.candidates.data[0].reviewedByName).toBeUndefined()
      expect(next).toHaveBeenCalledWith()
    })

    it('should show the success message once and then clear it', async () => {
      req.session.retentionReviewSuccess = 'Kieran Griffiths has been marked as reviewed'

      await list(req, res, next)

      expect(res.locals.successMessage).toBe('Kieran Griffiths has been marked as reviewed')
      expect(req.session).not.toHaveProperty('retentionReviewSuccess')
    })
  })

  describe('setReturnUrl()', () => {
    it('should use the return query parameter when it is a path on this site', () => {
      req.query.return = returnUrl

      setReturnUrl(req, res, next)

      expect(res.locals.returnUrl).toBe(returnUrl)
      expect(next).toHaveBeenCalled()
    })

    it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', undefined])(
      'should fall back to the list when the return is %p', (url) => {
        req.query.return = url

        setReturnUrl(req, res, next)

        expect(res.locals.returnUrl).toBe('/trainee-retention-review')
      })
  })

  describe('getOverride()', () => {
    beforeEach(() => {
      req.params.traineeId = 'trainee-1'
    })

    it('should set the override when the trainee has one', async () => {
      mockGet.mockResolvedValue({ extendedUntil: '2027-10-01' })

      await getOverride()(req, res, next)

      expect(mockGet).toHaveBeenCalledWith('test-token', 'trainee-1')
      expect(res.locals.override).toEqual({ extendedUntil: '2027-10-01' })
      expect(next).toHaveBeenCalledWith()
    })

    it('should carry on without an override when it is optional and there is none', async () => {
      mockGet.mockRejectedValue({ status: 404, message: 'Not found' })

      await getOverride()(req, res, next)

      expect(res.locals.override).toBeUndefined()
      expect(next).toHaveBeenCalledWith()
    })

    it('should pass a missing override to next when it is required', async () => {
      mockGet.mockRejectedValue({ status: 404, message: 'Not found' })

      await getOverride(true)(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }))
    })
  })

  describe('getReview()', () => {
    it('should set the review with the name of who reviewed them', async () => {
      req.params.traineeId = 'trainee-1'
      mockGetReview.mockResolvedValue({ reviewedBy: 'mca.ab@service.dev.smart.mcga.uk', note: 'ok' })
      mockGetAllByLogin.mockResolvedValue([
        { profile: { firstName: 'mca', lastName: 'ab', login: 'mca.ab@service.dev.smart.mcga.uk' } }
      ])

      await getReview(req, res, next)

      expect(mockGetReview).toHaveBeenCalledWith('test-token', 'trainee-1')
      expect(res.locals.review).toEqual({ reviewedBy: 'mca.ab@service.dev.smart.mcga.uk', note: 'ok', reviewedByName: 'mca ab' })
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('getNextRunDate()', () => {
    it('should set the next run date from the summary', async () => {
      await getNextRunDate(req, res, next)

      expect(res.locals.nextRunDate).toBe('2026-11-01')
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('setRetainDefaults()', () => {
    it('should default a new retention to a year from today', () => {
      setRetainDefaults(req, res, next)

      expect(res.locals.retention).toEqual({
        extendedUntil: moment().add(1, 'year').format('YYYY-MM-DD'),
        reason: undefined
      })
    })

    it('should default an extension to a year past the current retention, keeping the reason', () => {
      const extendedUntil = moment().add(2, 'months').format('YYYY-MM-DD')
      res.locals.override = { extendedUntil, reason: 'Legal hold' }

      setRetainDefaults(req, res, next)

      expect(res.locals.retention).toEqual({
        extendedUntil: moment(extendedUntil).add(1, 'year').format('YYYY-MM-DD'),
        reason: 'Legal hold'
      })
    })

    it('should default an extension of a retention that has already ended to a year from today', () => {
      res.locals.override = { extendedUntil: '2020-01-01', reason: 'Legal hold' }

      setRetainDefaults(req, res, next)

      expect(res.locals.retention.extendedUntil).toBe(moment().add(1, 'year').format('YYYY-MM-DD'))
    })
  })

  describe('retain()', () => {
    beforeEach(() => {
      req.params.traineeId = 'trainee-1'
      req.query.return = returnUrl
      req.body = {
        reason: '  Legal hold ',
        'extendedUntil-day': '1',
        'extendedUntil-month': '10',
        'extendedUntil-year': '2027'
      }
      res.locals.trainee = { contactName: 'Kieran Griffiths' }
    })

    it('should create an override when the trainee has none and redirect back with a success message', async () => {
      mockCreate.mockResolvedValue({})

      await retain(req, res, next)

      expect(mockCreate).toHaveBeenCalledWith('test-token', {
        traineeId: 'trainee-1',
        extendedUntil: '2027-10-01',
        reason: 'Legal hold'
      })
      expect(mockPut).not.toHaveBeenCalled()
      expect(req.session.retentionReviewSuccess).toBe('Kieran Griffiths will be retained until 1 October 2027')
      expect(res.redirect).toHaveBeenCalledWith(returnUrl)
    })

    it('should update the override when the trainee already has one', async () => {
      res.locals.override = { extendedUntil: '2026-10-20' }
      mockPut.mockResolvedValue({})

      await retain(req, res, next)

      expect(mockPut).toHaveBeenCalledWith('test-token', 'trainee-1', expect.objectContaining({ extendedUntil: '2027-10-01' }))
      expect(mockCreate).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith(returnUrl)
    })

    it('should redirect to the list when the return is not a path on this site', async () => {
      req.query.return = 'https://evil.com'
      mockCreate.mockResolvedValue({})

      await retain(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/trainee-retention-review')
    })

    it('should render the form with errors when validation fails', async () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        errors: [{ msg: 'Enter a reason for retaining the trainee', param: 'reason' }]
      })

      await retain(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.render).toHaveBeenCalledWith('trainee-retention-review/retain', {
        errors: [{ text: 'Enter a reason for retaining the trainee', href: '#reason' }]
      })
      expect(mockCreate).not.toHaveBeenCalled()
      expect(res.locals.retention.reason).toBe('Legal hold')
    })

    it('should render the form with the API error when the API rejects it', async () => {
      mockCreate.mockRejectedValue(apiError(400, 'extendedUntil must not be in the past'))

      await retain(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.render).toHaveBeenCalledWith('trainee-retention-review/retain', expect.objectContaining({
        errors: [{ text: 'extendedUntil must not be in the past' }]
      }))
      expect(res.redirect).not.toHaveBeenCalled()
    })
  })

  describe('review()', () => {
    beforeEach(() => {
      req.params.traineeId = 'trainee-1'
      req.query.return = returnUrl
      res.locals.trainee = { contactName: 'Kieran Griffiths' }
      mockCreateReview.mockResolvedValue({})
    })

    it('should mark the trainee reviewed with a note and redirect back with a success message', async () => {
      req.body.note = ' No longer training '

      await review(req, res, next)

      expect(mockCreateReview).toHaveBeenCalledWith('test-token', { traineeId: 'trainee-1', note: 'No longer training' })
      expect(req.session.retentionReviewSuccess).toBe('Kieran Griffiths has been marked as reviewed')
      expect(res.redirect).toHaveBeenCalledWith(returnUrl)
    })

    it('should leave out a blank note', async () => {
      req.body.note = '   '

      await review(req, res, next)

      expect(mockCreateReview).toHaveBeenCalledWith('test-token', { traineeId: 'trainee-1' })
    })

    it('should render the form with the API error when the API rejects it', async () => {
      mockCreateReview.mockRejectedValue(apiError(400, 'Trainee has already been reviewed'))

      await review(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.render).toHaveBeenCalledWith('trainee-retention-review/review', expect.objectContaining({
        errors: [{ text: 'Trainee has already been reviewed' }]
      }))
    })
  })

  describe('removeRetention()', () => {
    it('should delete the override and redirect back with a success message', async () => {
      req.params.traineeId = 'trainee-1'
      req.query.return = returnUrl
      res.locals.trainee = { contactName: 'Kieran Griffiths' }
      mockDel.mockResolvedValue({})

      await removeRetention(req, res, next)

      expect(mockDel).toHaveBeenCalledWith('test-token', 'trainee-1')
      expect(req.session.retentionReviewSuccess).toBe('Retention removed for Kieran Griffiths')
      expect(res.redirect).toHaveBeenCalledWith(returnUrl)
    })

    it('should pass errors other than validation failures to next', async () => {
      const err = apiError(404, 'Not found')
      mockDel.mockRejectedValue(err)

      await removeRetention(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.redirect).not.toHaveBeenCalled()
    })
  })

  describe('undoReview()', () => {
    it('should delete the review and redirect back with a success message', async () => {
      req.params.traineeId = 'trainee-1'
      req.query.return = returnUrl
      res.locals.trainee = { contactName: 'Kieran Griffiths' }
      mockDeleteReview.mockResolvedValue({})

      await undoReview(req, res, next)

      expect(mockDeleteReview).toHaveBeenCalledWith('test-token', 'trainee-1')
      expect(req.session.retentionReviewSuccess).toBe('Review undone for Kieran Griffiths')
      expect(res.redirect).toHaveBeenCalledWith(returnUrl)
    })
  })
})
