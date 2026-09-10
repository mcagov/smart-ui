import { jest, describe, it, expect, beforeEach } from '@jest/globals'

const mockCreate = jest.fn()

jest.unstable_mockModule('../../src/services/trainingprovidertrainings.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    create: mockCreate
  }))
}))

const { default: trainingController } = await import('../../src/controllers/tptrainings.js')
const { createTraining } = trainingController

describe('Unit tests for the training provider trainings controller', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    req = {
      params: { id: 'tp-1' },
      body: {},
      session: { passport: { user: { tokens: { access_token: 'test-token' } } } }
    }
    res = { redirect: jest.fn() }
    next = jest.fn()
  })

  describe('createTraining()', () => {
    it('should create a training against the chosen training item and redirect to the trainings list', async () => {
      req.body = { 'training-item': '8b8b184f-8bfc-4d1f-a057-78c281bb9b7b' }
      mockCreate.mockResolvedValue({})

      await createTraining(req, res, next)

      expect(mockCreate).toHaveBeenCalledWith('test-token', {
        trainingProviderId: 'tp-1',
        trainingItemId: '8b8b184f-8bfc-4d1f-a057-78c281bb9b7b',
        status: 'Active'
      })
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/trainings?status=Active')
    })

    it('should call next with the error if creation fails', async () => {
      const err = new Error('Bad Request')
      mockCreate.mockRejectedValue(err)

      await createTraining(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.redirect).not.toHaveBeenCalled()
    })
  })
})
