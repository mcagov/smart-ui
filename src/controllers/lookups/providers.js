import TrainingProviders from '../../services/trainingproviders.js'
import ClientCompanies from '../../services/clientcompanies.js'
import Enrolments from '../../services/enrolments.js'
import assert from 'assert'
import {
  defaultPageLimits,
  handleLookupError,
  getQueryParams,
  setPageMeta
} from './common.js'
import { getAccessToken, getDurationInWeeks, hasRole } from '../../utils.js'

const trainingProviders = new TrainingProviders()
const clientCompanies = new ClientCompanies()
const enrolments = new Enrolments()

export function getTP(failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.id, 'req.params.id is not set')
      if (req.params.id !== 'create' && req.params.id !== 'all') {
        res.locals.trainingProvider = await trainingProviders.get(
          getAccessToken(req),
          req.params.id
        )
        req.session.activeTp = req.params.id
      }
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getEnrolments(failSilent = false) {
  return async function (req, res, next) {
    try {
      const queryKeys = ['searchText', 'trainingId', 'status']
      const params = getQueryParams(req, queryKeys, 'trainee.contactName')

      // if (!hasRole(req, 'admin') || req.query.allTps !== 'true') {
      if (req.query.allTps !== 'true') {
        params.trainingProviderId = req.params.id
      }

      if (req.params.traineeId) {
        params.traineeId = req.params.traineeId
        params.sort = 'startDate'
        req.query.sort = 'startDate'
      }
      res.locals.enrolments = await enrolments.all(getAccessToken(req), params)
      setPageMeta(req, res.locals.enrolments, queryKeys)
      res.locals.allTps = req.query.allTps
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getEnrolment(failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.enrolment = await enrolments.get(
        getAccessToken(req),
        req.params.enrolmentId
      )
      res.locals.durationInWeeks = getDurationInWeeks(
        res.locals.enrolment.startDate,
        res.locals.enrolment.expectedEndDate
      )
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getAllCC(failSilent = false) {
  return async function (req, res, next) {
    try {
      defaultPageLimits(req)
      const params = {
        page: req.query.page,
        limit: req.query.limit
      }
      res.locals.clientCompanies = await clientCompanies.all(
        getAccessToken(req),
        params
      )
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}
