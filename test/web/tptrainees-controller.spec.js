import { jest, describe, it, expect, beforeEach } from '@jest/globals'

const mockCreate = jest.fn()
const mockPut = jest.fn()
const mockUpdateStatus = jest.fn()
const mockValidationResult = jest.fn()

jest.unstable_mockModule('../../src/services/trainees.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    create: mockCreate,
    put: mockPut,
    updateStatus: mockUpdateStatus
  }))
}))

jest.unstable_mockModule('express-validator', () => ({
  __esModule: true,
  validationResult: mockValidationResult
}))

const {
  updateTraineeDetails,
  updateTraineeAddressDetails,
  updateTraineeStatus
} = await import('../../src/controllers/tptrainees.js')

describe('Unit tests for the training-provider trainee controller', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    mockValidationResult.mockReturnValue({ isEmpty: () => true, errors: [] })

    req = {
      params: { id: 'tp-1' },
      query: {},
      body: {},
      session: { passport: { user: { tokens: { access_token: 'test-token' } } } }
    }
    res = {
      locals: { trainee: {} },
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      render: jest.fn()
    }
    next = jest.fn()
  })

  describe('updateTraineeDetails()', () => {
    const detailsBody = {
      'contact-name': 'Sam Smith',
      nationality: 'UK',
      'place-of-birth': 'London',
      'dob-year': '1990',
      'dob-month': '10',
      'dob-day': '1',
      gender: 'Female'
    }

    it('should return the correct new trainee (no traineeId yet) details and redirect to the address page', async () => {
      req.body = detailsBody
      mockCreate.mockResolvedValue({ id: 'new-trainee-id' })

      await updateTraineeDetails()(req, res, next)

      expect(mockCreate).toHaveBeenCalledWith('test-token', expect.objectContaining({
        contactName: 'Sam Smith',
        nationality: 'UK',
        placeOfBirth: 'London',
        gender: 'Female',
        trainingProviderId: 'tp-1'
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/trainees/new-trainee-id/address')
    })

    it('should return the updated existing trainee and redirect to the address page', async () => {
      req.params.traineeId = 'trainee-1'
      req.body = detailsBody
      mockPut.mockResolvedValue({})

      await updateTraineeDetails()(req, res, next)

      expect(mockPut).toHaveBeenCalledWith('test-token', 'trainee-1', expect.objectContaining({
        contactName: 'Sam Smith'
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/trainees/trainee-1/address')
    })

    it('should render the details form with errors when validation fails', async () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        errors: [{ msg: 'Contact name is required', param: 'contact-name' }]
      })

      await updateTraineeDetails()(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.render).toHaveBeenCalledWith('tptrainees/details', expect.objectContaining({
        errors: [{ text: 'Contact name is required', href: '#contact-name' }]
      }))
      expect(mockCreate).not.toHaveBeenCalled()
    })
  })

  describe('updateTraineeAddressDetails()', () => {
    it('should return the updated trainee address and redirect to the trainee page', async () => {
      req.params.traineeId = 'trainee-1'
      req.body = {
        'address-line-1': '1 Orange Tree Road',
        'address-line-2': 'Devon',
        'address-town': 'Tavistock',
        'address-postcode': 'TD11 4FF'
      }
      mockPut.mockResolvedValue({})

      await updateTraineeAddressDetails()(req, res, next)

      expect(mockPut).toHaveBeenCalledWith('test-token', 'trainee-1', expect.objectContaining({
        addressLine1: '1 Orange Tree Road',
        townArea: 'Tavistock',
        postcode: 'TD11 4FF'
      }))
      // updateTrainee() (tptrainees.js) always puts a "/" before nextPage in its
      // redirect template; address is the last step in the create-trainee flow,
      // so it passes nextPage: '' rather than a real page, leaving that trailing
      // slash instead of the usual "/address" or "/details" segment    
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/trainees/trainee-1/')
    }) 
  })

  describe('updateTraineeStatus()', () => {
    it('should return the updated trainee status and redirect to the trainee page', async () => {
      req.params.traineeId = 'trainee-1'
      res.locals.statusAction = 'Active'
      mockUpdateStatus.mockResolvedValue({})

      await updateTraineeStatus()(req, res, next)

      expect(mockUpdateStatus).toHaveBeenCalledWith('test-token', 'trainee-1', 'Active')
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/trainees/trainee-1')
    })
  })
})
