import TrainingProviders from '../services/trainingproviders.js'
import ClientCompanies from '../services/clientcompanies.js'
import { validationResult } from 'express-validator'
import { getAccessToken, govUKErrors } from '../utils.js'
import { logger } from '@mca/common-logger'
import { getQueryParams, handleLookupError, setPageMeta } from './lookups/common.js'

const trainingProviders = new TrainingProviders()
const clientCompanies = new ClientCompanies()

const templateBase = 'providers'

export function all (failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getQueryParams(req, [], 'companyName', 100)
      res.locals.trainingProviders = await trainingProviders.all(getAccessToken(req), params)
      setPageMeta(req, res.locals.trainingProviders)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

function createTrainingProvider (req, res, next) {
  res.locals.trainingProvider = {}
  next()
}

function trainingProvidersPage (req, res, next) {
  req.query.page ??= 1
  req.query.limit ??= 10
  req.query.sort ??= 'companyName'
  req.query.order ??= 'asc'

  const params = {
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
    order: req.query.order
  }

  if (req.query.searchText) {
    req.query.searchText = req.query.searchText.trim()
    params.companyName = req.query.searchText
    params.representative = req.query.searchText
    params.phone = req.query.searchText
  }

  if (req.query.status !== -1) {
    params.status = req.query.status
  } else {
    params.status = ['Active', 'Deactivated', 'Pending']
  }

  trainingProviders
    .all(getAccessToken(req), params)
    .then(results => {
      const data = {}
      data.trainingProviders = results.data
      data.meta = results.meta
      data.meta.limit = req.query.limit
      data.meta.page = req.query.page
      data.meta.queries = {
        searchText: req.query.searchText,
        status: req.query.status
      }
      res.status(200).render(`${templateBase}/training-providers`, { data })
    })
    .catch((err) => {
      logger.warn('error while calling trainingProviders.all()', err)
      next(err)
    })
}

function updateDetails (req, res, next) {
  res.locals.trainingProvider.companyName = req.body['company-name']
  res.locals.trainingProvider.companyNumber = req.body['company-number']
  res.locals.trainingProvider.dunsNumber = req.body['duns-number']
  res.locals.trainingProvider.phone = req.body['phone-number']
  res.locals.trainingProvider.faxNumber = req.body['fax-number']
  res.locals.trainingProvider.email = req.body.email
  res.locals.trainingProvider.vesselNames = req.body['vessel-names']
  res.locals.trainingProvider.maxNoTrainees = req.body['max-trainees']
  updateTrainingProvider(req, res, next, res.locals.trainingProvider, 'details', 'representative')
}

function updateRepresentativeDetails (req, res, next) {
  res.locals.trainingProvider.representative = req.body.representative
  res.locals.trainingProvider.representativeContactNumber = req.body['rep-contact-number']
  res.locals.trainingProvider.liaisonOfficer = req.body['liaison-officer']
  res.locals.trainingProvider.liaisonOfficerContactNumber = req.body['lo-contact-number']
  res.locals.trainingProvider.trainingOfficer = req.body['training-officer']
  res.locals.trainingProvider.trainingOfficerContactNumber = req.body['to-contact-number']
  updateTrainingProvider(req, res, next, res.locals.trainingProvider, 'representative', 'address')
}

function updateAddressDetails (req, res, next) {
  res.locals.trainingProvider.addressLine1 = req.body['address-line-1']
  res.locals.trainingProvider.addressLine2 = req.body['address-line-2']
  res.locals.trainingProvider.townArea = req.body['address-town']
  res.locals.trainingProvider.postcode = req.body['address-postcode']
  updateTrainingProvider(req, res, next, res.locals.trainingProvider, 'address', 'banking')
}

function updateBankingDetails (req, res, next) {
  const nextPage = 'summary'
  res.locals.trainingProvider.sortCode = req.body['sort-code']
  res.locals.trainingProvider.accountNumber = req.body['account-number']
  updateTrainingProvider(req, res, next, res.locals.trainingProvider, 'banking', nextPage)
}

function updateStatus (req, res, next) {
  res.locals.trainingProvider.status = req.params.status
  trainingProviders
    .put(getAccessToken(req), req.params.id, res.locals.trainingProvider)
    .then(_ => {
      handleRedirect(res, req.query.return, `/training-providers/${req.params.id}`)
    })
    .catch(next)
}

async function updateTrainingProvider (req, res, next, data, page, nextPage) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render(`${templateBase}/${page}`, {
      errors: govUKErrors(errors.errors),
      trainingProvider: data
    })
  } else {
    try {
      if (req.params.id) {
        await trainingProviders.put(getAccessToken(req), req.params.id, data)
      } else {
        const tp = await trainingProviders.create(getAccessToken(req), data)
        req.params.id = tp.id
      }
      handleRedirect(res, req.query.return, `/training-providers/${req.params.id}/${nextPage}`)
    } catch (err) {
      if (err.status === 400 || err.status === 401) {
        res.status(400).render(`${templateBase}/${page}`, {
          errors: matchErrorWithInput(err),
          trainingProvider: data
        })
      } else {
        next(err)
      }
    }
  }
}

function handleRedirect (res, returnParam, defaultPage) {
  if (returnParam) {
    res.redirect(returnParam)
  } else {
    res.redirect(defaultPage)
  }
}

function updateClientCompanies (req, res, next) {
  const cc = req.body['client-company']
  clientCompanies
    .linkTrainingProvider(getAccessToken(req), cc, req.params.id)
    .then(_ => {
      res.redirect(`/training-providers/${req.params.id}/client-companies`)
    })
    .catch(err => next(err))
}

function removeClientCompanies (req, res, next) {
  clientCompanies
    .removeTrainingProvider(getAccessToken(req), req.params.ccid, req.params.id)
    .then(_ => {
      handleRedirect(res, req.query.return, `/training-providers/${req.params.id}/client-companies`)
    })
    .catch(err => next(err))
}

function matchErrorWithInput (error) {
  const message = error.response.body.message
  switch (message) {
    case 'Company number is not unique':
      return govUKErrors([{ msg: message, param: 'company-number' }])
    case 'Client company number is not unique':
      return govUKErrors([{ msg: message, param: 'client-company-number' }])
    default:
      return govUKErrors([{ msg: message }])
  }
}

export function auditContext (req, res, next) {
  res.locals.resourceUrl = `/training-providers/${req.params.id}/audit`
  res.locals.resourceName = 'Audit'
  // res.locals.resourceName = res.locals.trainingProvider.companyName
  res.locals.attachmentsTitle = 'Manage audit evidence attachments'
  res.locals.attachmentTypes = [
    { description: 'Certificate of incorporation', fileType: 'certificate-of-incorporation' },
    { description: 'Training provider agreement', fileType: 'training-provider-agreement' },
    { description: 'Other', fileType: 'other' }
  ]
  next()
}

export function resourceContext (req, res, next) {
  res.locals.resourceUrl = `/training-providers/${req.params.id}`
  res.locals.attachmentsTitle = 'Manage audit evidence attachments'
  res.locals.attachmentTypes = [
    { description: 'Certificate of incorporation', fileType: 'certificate-of-incorporation' },
    { description: 'Training provider agreement', fileType: 'training-provider-agreement' },
    { description: 'Other', fileType: 'other' }
  ]
  next()
}

export default {
  // Training providers
  trainingProvidersPage,
  createTrainingProvider,
  updateRepresentativeDetails,
  updateDetails,
  updateAddressDetails,
  updateBankingDetails,
  updateStatus,
  // Client companies
  updateClientCompanies,
  removeClientCompanies
}
