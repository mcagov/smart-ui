import { jest, describe, it, expect, beforeEach } from '@jest/globals'

const mockCreate = jest.fn()
const mockPut = jest.fn()
const mockValidationResult = jest.fn()

jest.unstable_mockModule('../../src/services/trainingproviders.js', () => ({
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

const { default: providerController } = await import('../../src/controllers/providers.js')
const {
  updateDetails,
  updateRepresentativeDetails,
  updateAddressDetails,
  updateBankingDetails,
  updateStatus
} = providerController

const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

describe('Unit tests for the training provider controller', () => {
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
      locals: { trainingProvider: {} },
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      render: jest.fn()
    }
    next = jest.fn()
  })

  describe('updateDetails()', () => {
    it('should return the correct training provider data (no id yet) and redirect to the representative page', async () => {
      delete req.params.id
      req.body = {
        'company-name': 'test 232',
        'company-number': '55098765',
        'phone-number': '12345678901',
        'max-trainees': '50'
      }
      mockCreate.mockResolvedValue({ id: 'new-tp-id' })

      updateDetails(req, res, next)
      await flushPromises()

      expect(mockCreate).toHaveBeenCalledWith('test-token', expect.objectContaining({
        companyName: 'test 232',
        companyNumber: '55098765',
        phone: '12345678901',
        maxNoTrainees: '50'
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/new-tp-id/representative')
    })

    it('should return the correct training provider data and redirect to the representative page', async () => {
      req.body = {
        'company-name': 'test 232',
        'company-number': '55098765',
        'phone-number': '12345678901',
        'max-trainees': '50'
      }
      mockPut.mockResolvedValue({})

      updateDetails(req, res, next)
      await flushPromises()

      expect(mockPut).toHaveBeenCalledWith('test-token', 'tp-1', expect.objectContaining({
        companyName: 'test 232'
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/representative')
    })

    it('should render the details form with a company-number error when the number is not unique', async () => {
      req.body = {
        'company-name': 'test 232',
        'company-number': '55095990',
        'phone-number': '12345678901',
        'max-trainees': '50'
      }
      const err = new Error('Bad Request')
      err.status = 400
      err.response = { body: { message: 'Company number is not unique' } }
      mockPut.mockRejectedValue(err)

      updateDetails(req, res, next)
      await flushPromises()

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.render).toHaveBeenCalledWith('providers/details', expect.objectContaining({
        errors: [{ text: 'Company number is not unique', href: '#company-number' }]
      }))
    })

    it('should render the details form with errors for blank company details', async () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        errors: [{ msg: 'Company name is required', param: 'company-name' }]
      })

      updateDetails(req, res, next)
      await flushPromises()

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockCreate).not.toHaveBeenCalled()
      expect(mockPut).not.toHaveBeenCalled()
    })
  })

  describe('updateRepresentativeDetails()', () => {
    it('should return the correct representative details and redirect to the address page', async () => {
      req.body = {
        representative: 'Company owner',
        'liaison-officer': 'Officer name 1',
        'training-officer': 'Officer name 2'
      }
      mockPut.mockResolvedValue({})

      updateRepresentativeDetails(req, res, next)
      await flushPromises()

      expect(mockPut).toHaveBeenCalledWith('test-token', 'tp-1', expect.objectContaining({
        representative: 'Company owner',
        liaisonOfficer: 'Officer name 1',
        trainingOfficer: 'Officer name 2'
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/address')
    })

    it('should render the representative form with errors for a blank representative', async () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        errors: [{ msg: 'Representative is required', param: 'representative' }]
      })

      updateRepresentativeDetails(req, res, next)
      await flushPromises()

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockPut).not.toHaveBeenCalled()
    })
  })

  describe('updateAddressDetails()', () => {
    it('should return the correct address and redirect to the banking page', async () => {
      req.body = {
        'address-line-1': 'address 1',
        'address-line-2': 'address 2',
        'address-town': 'town',
        'address-postcode': 'postcode'
      }
      mockPut.mockResolvedValue({})

      updateAddressDetails(req, res, next)
      await flushPromises()

      expect(mockPut).toHaveBeenCalledWith('test-token', 'tp-1', expect.objectContaining({
        addressLine1: 'address 1',
        townArea: 'town',
        postcode: 'postcode'
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/banking')
    })

    it('should render the address form with errors for a blank address', async () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        errors: [{ msg: 'Address line 1 is required', param: 'address-line-1' }]
      })

      updateAddressDetails(req, res, next)
      await flushPromises()

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockPut).not.toHaveBeenCalled()
    })
  })

  describe('updateBankingDetails()', () => {
    it('should return the correct banking details and redirect to the summary page', async () => {
      req.body = { 'sort-code': '123456', 'account-number': '12345678' }
      mockPut.mockResolvedValue({})

      updateBankingDetails(req, res, next)
      await flushPromises()

      expect(mockPut).toHaveBeenCalledWith('test-token', 'tp-1', expect.objectContaining({
        sortCode: '123456',
        accountNumber: '12345678'
      }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1/summary')
    })

    it('should render the banking form with errors for blank banking details', async () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        errors: [{ msg: 'Sort code is required', param: 'sort-code' }]
      })

      updateBankingDetails(req, res, next)
      await flushPromises()

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockPut).not.toHaveBeenCalled()
    })
  })

  describe('updateStatus()', () => {
    it('should reutrn the correct training provider status and redirect to the provider page', async () => {
      req.params.status = 'Active'
      mockPut.mockResolvedValue({})

      updateStatus(req, res, next)
      await flushPromises()

      expect(mockPut).toHaveBeenCalledWith('test-token', 'tp-1', expect.objectContaining({ status: 'Active' }))
      expect(res.redirect).toHaveBeenCalledWith('/training-providers/tp-1')
    })
  })
})
