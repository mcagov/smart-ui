import { jest, describe, it, expect, beforeEach } from '@jest/globals'

const mockCreate = jest.fn()
const mockPut = jest.fn()
const mockValidationResult = jest.fn()

jest.unstable_mockModule('../../src/services/absences.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    create: mockCreate,
    put: mockPut
  }))
}))

jest.unstable_mockModule('express-validator', () => ({
  __esModule: true,
  validationResult: mockValidationResult
}))

const { create, update } = await import('../../src/controllers/absences.js')

const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

describe('Unit tests for the absences controller', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    mockValidationResult.mockReturnValue({ isEmpty: () => true, errors: [] })

    req = {
      params: { id: 'tp-1', traineeId: 'trainee-1' },
      query: {},
      body: {
        'start-date-year': '2022',
        'start-date-month': '3',
        'start-date-day': '28',
        duration: '1.5'
      },
      session: { passport: { user: { tokens: { access_token: 'test-token' } } } }
    }
    res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      render: jest.fn()
    }
    next = jest.fn()
  })

  describe('create()', () => {
    it('should call the service with the correctly-shaped absence and redirect on success', async () => {
      mockCreate.mockResolvedValue({})

      create(req, res, next)
      await flushPromises()

      expect(mockCreate).toHaveBeenCalledWith('test-token', expect.objectContaining({
        trainingProviderId: 'tp-1',
        traineeId: 'trainee-1',
        startDate: '2022-03-28',
        duration: 1.5
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/trainees/trainee-1/absences')
    })

    it('should render the details form with errors when validation fails', async () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        errors: [{ msg: 'Enter the duration of the absence', param: 'duration' }]
      })

      create(req, res, next)
      await flushPromises()

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.render).toHaveBeenCalledWith('absences/details', expect.objectContaining({
        errors: [{ text: 'Enter the duration of the absence', href: '#duration' }]
      }))
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should render the details form with the API error when the API rejects the absence', async () => {
      const err = new Error('Bad Request')
      err.status = 400
      err.response = { body: { message: 'Absence overlaps an existing absence' } }
      mockCreate.mockRejectedValue(err)

      create(req, res, next)
      await flushPromises()

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.render).toHaveBeenCalledWith('absences/details', expect.objectContaining({
        errors: [{ text: 'Absence overlaps an existing absence' }]
      }))
    })
  })

  describe('update()', () => {
    it('should call the service with the correctly-shaped update and redirect on success', async () => {
      req.params.absenceId = 'absence-1'
      mockPut.mockResolvedValue({})

      update(req, res, next)
      await flushPromises()

      expect(mockPut).toHaveBeenCalledWith('test-token', 'absence-1', expect.objectContaining({
        startDate: '2022-03-28',
        duration: 1.5
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/trainees/trainee-1/absences')
    })

    it('should render the details form with errors when validation fails', async () => {
      req.params.absenceId = 'absence-1'
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        errors: [{ msg: 'Enter a day between 1 and 31', param: 'start-date-day' }]
      })

      update(req, res, next)
      await flushPromises()

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockPut).not.toHaveBeenCalled()
    })
  })
})
