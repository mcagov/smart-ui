import Trainees from '../../services/trainees.js'
import Enrolments from '../../services/enrolments.js'
import { handleLookupError, getQueryParams, setPageMeta } from './common.js'
import assert from 'assert'
import { logger } from '@mca/common-logger'
import { getAccessToken } from '../../utils.js'
import moment from 'moment'

const trainees = new Trainees()
const enrolments = new Enrolments()

export function getTrainee (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.traineeId, 'req.params.traineeId is not set')
      res.locals.trainee = await trainees.get(getAccessToken(req), req.params.traineeId)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTrainees (failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getTraineeSearchParams(req)
      res.locals.trainees = await trainees.search(getAccessToken(req), params)
      setMeta(req, res)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getDuplicates (failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getTraineeSearchParams(req)
      res.locals.trainees = await trainees.duplicates(getAccessToken(req), params)
      setMeta(req, res)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTransferring (failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getTraineeSearchParams(req)
      res.locals.trainees = await trainees.transferring(getAccessToken(req), params)
      setMeta(req, res)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTraineesByTrainingProviderId (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.id, 'req.params.id is not set')
      const params = getTraineeSearchParams(req)
      params.trainingProviderId = req.params.id
      res.locals.trainees = await trainees.search(getAccessToken(req), params)
      setMeta(req, res)
      next()
    } catch (err) {
      res.locals.backUrl = req.originalUrl.split('?').shift()
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getEnrolments (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.id, 'req.params.id is not set')
      assert.ok(req.params.trainingId, 'req.params.trainingId is not set')
      req.query.sort ??= 'trainee.contactName'
      const params = getTraineeSearchParams(req)
      params.trainingProviderId = req.params.id
      params.trainingId = req.params.trainingId
      delete params.status
      res.locals.enrolments = await enrolments.getByTrainingId(getAccessToken(req), params)
      res.locals.enrolments.meta.page = req.query.page
      res.locals.enrolments.meta.limit = req.query.limit
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

function getTraineeSearchParams (req) {
  const params = getQueryParams(req, ['status'], 'contactName')
  if (req.query.searchText) {
    req.query.searchText = req.query.searchText.trim()
    params.contactName = req.query.searchText
    params.matsuNumber = req.query.searchText
    params.postcode = req.query.searchText
  }
  if (req.query.searchDob) {
    var searchDob = moment(req.query.searchDob.trim(), 'DD-MM-YYYY')
    if (!searchDob.isValid()) {
      throw new Error(
        'The date of birth is not valid. Please enter a  date of birth in the format DD-MM-YYYY'
      )
    }
    params.dateOfBirth = searchDob.format('DD-MM-YYYY')
    req.query.searchDob = params.dateOfBirth
  }
  logger.debug(`getTraineeSearchParams: return ${JSON.stringify(params)}`)
  return params
}

function setMeta (req, res) {
  res.locals.trainees.meta.page = req.query.page
  res.locals.trainees.meta.limit = req.query.limit
  res.locals.trainees.meta.queries = {
    searchText: req.query.searchText,
    searchDob: req.query.searchDob,
    status: req.query.status
  }
}

export function traineeSearch (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.query.contactName, 'req.query.contactName is not set')
      assert.ok(req.query.trainingProviderId, 'req.query.trainingProviderId is not set')
      logger.info('Search trainees using contactName:' + req.query.contactName + ' and trainingProviderId:' + req.query.trainingProviderId)
      const data = await trainees.search(getAccessToken(req), {
        trainingProviderId: req.query.trainingProviderId,
        contactName: req.query.contactName
      })
      res.locals.trainees = data.data.map(t => { return { suggestion: t.contactName, value: t.id } })
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTraineesClaims (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.traineeId, 'req.params.traineeId is not set')
      const params = getQueryParams(req, [], 'claim.financialYear, claim.financialPeriod')
      res.locals.claimItems = await trainees.getTraineesClaims(getAccessToken(req), req.params.traineeId, params)
      res.locals.claimItems.meta.page = req.query.page
      res.locals.claimItems.meta.limit = req.query.limit
      req.query.sort = 'period'
      setPageMeta(req, res.locals.claimItems)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getAllTraineesClaims (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.traineeId, 'req.params.traineeId is not set')
      if (!req.query.order) req.query.order = 'desc'
      const params = getQueryParams(req, [], 'financialYear, financialPeriod')
      res.locals.claimItems = await trainees.getAllClaims(getAccessToken(req), req.params.traineeId, params)
      res.locals.claimItems.meta.page = req.query.page
      res.locals.claimItems.meta.limit = req.query.limit
      req.query.sort = 'period'
      setPageMeta(req, res.locals.claimItems)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getAllTraineesForecasts (forecastType, failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.traineeId, 'req.params.traineeId is not set')
      if (!req.query.order) req.query.order = 'asc'
      const params = getQueryParams(req, [], 'financialYear, financialPeriod')
      params.forecastType = forecastType
      res.locals.forecastItems = await trainees.getAllForecasts(getAccessToken(req), req.params.traineeId, params)
      res.locals.forecastItems.meta.page = req.query.page
      res.locals.forecastItems.meta.limit = req.query.limit
      req.query.sort = 'period'
      setPageMeta(req, res.locals.forecastItems)
      res.locals.forecastItems.meta.forecastType = forecastType
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}
