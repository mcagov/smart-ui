import PaymentSchedules from '../services/payment-schedules.mjs'
import { getAccessToken } from '../utils.js'
import { handleLookupError, getQueryParams, setPageMeta, getPageParams } from './lookups/common.js'
import moment from 'moment-timezone'

const service = new PaymentSchedules()

export async function all (req, res, next) {
  try {
    req.query.order ??= 'desc'
    const queryKeys = ['financialYear']
    const params = getQueryParams(req, queryKeys, 'financialPeriod', 12)
    res.locals.paymentSchedules = await service.all(getAccessToken(req), params)
    setPageMeta(req, res.locals.paymentSchedules, queryKeys)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function getByYear (req, res, next) {
  try {
    const financialYear = (req.query.financialYear ? req.query.financialYear : res.locals.currentPaymentSchedule.financialYear) + ''
    req.query.order ??= 'asc'
    const params = getPageParams(req, 'financialPeriod', 12)
    res.locals.paymentSchedules = await service.getByYear(getAccessToken(req), financialYear, params)
    res.locals.financialYear = financialYear
    setPageMeta(req, res.locals.paymentSchedules, params)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export function getPaymentSchedule (failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.paymentSchedule = await service.get(getAccessToken(req), req.params.year, req.params.period)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getAvailableYears (failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.availableYears = await service.getAvailableYears(getAccessToken(req))
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getCurrentPaymentSchedule (failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.currentPaymentSchedule = await service.getByDate(getAccessToken(req), moment().format('YYYY-MM-DD'))
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}
