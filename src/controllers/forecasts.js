import { logger } from '@mca/common-logger'
import Forecasts from '../services/forecasts.js'
import WorkflowLogs from '../services/workflow-logs.js'
import { capitalize, getAccessToken, govUKErrors, isBlank } from '../utils.js'
import {
  defaultPageLimits,
  handleLookupError,
  getQueryParams,
  setPageMeta,
  handleApiError
} from './lookups/common.js'
import PaymentSchedules from '../services/payment-schedules.mjs'
import { financialPeriodFormat, financialYearFormat } from '../nunjucks.js'
import config from '../config.js'

const service = new Forecasts()
const paymentSchedules = new PaymentSchedules()
const workflowLogsService = new WorkflowLogs()

export async function create(req, res) {
  const redirect = `/training-providers/${req.params.id}/forecasts/${req.params.forecastType}/${req.params.year}`

  try {
    res.locals.forecastType = req.params.forecastType
    if (config.features.enableForecastWorkflow) {
      await service.schedule(
        getAccessToken(req),
        req.params.forecastType,
        req.params.id,
        req.params.year,
        req.params.period
      )
    } else {
      await service.create(
        getAccessToken(req),
        req.params.forecastType,
        req.params.id,
        req.params.year,
        req.params.period
      )
    }
    res.redirect(redirect)
  } catch (err) {
    logger.error(`create: exception `, err)
    res.status(400).render('forecasts/period', {
      errors: govUKErrors([{ msg: err.message }])
    })
  }
}

export function getPending(failSilent = false) {
  return async function (req, res, next) {
    try {
      const queryKeys = ['financialYear', 'financialPeriod']
      const params = getQueryParams(req, queryKeys, 'financialYear')
      params.status = 'pending'
      res.locals.forecasts = await service.all(getAccessToken(req), params)
      setPageMeta(req, res.locals.forecasts, queryKeys)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getWorkflowLogs(failSilent = false) {
  return async function (req, res, next) {
    try {
      console.log('getWorkflowLogs')
      const params = getQueryParams(req, [])
      params.workflow = 'forecast'
      params.trainingProviderId = req.params.id
      console.log('params', params)
      res.locals.workflowLogs = await workflowLogsService.allByWorkflow(
        getAccessToken(req),
        params
      )
      setPageMeta(req, res.locals.workflowLogs, [])
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function search(failSilent = false) {
  return async function (req, res, next) {
    try {
      if (!req.query.status) {
        req.query.status = 'Pending'
      }
      const queryKeys = [
        'financialYear',
        'financialPeriod',
        'status',
        'forecastType'
      ]
      const params = getQueryParams(
        req,
        queryKeys,
        'financialYear,financialPeriod'
      )
      res.locals.forecasts = await service.all(getAccessToken(req), params)
      setPageMeta(req, res.locals.forecasts, queryKeys)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getPaymentSchedules(failSilent = false) {
  return async function (req, res, next) {
    try {
      if (!isBlank(req.query.financialYear)) {
        res.locals.paymentSchedules = await paymentSchedules.getByYear(
          getAccessToken(req),
          req.query.financialYear
        )
      }
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getSummary(failSilent = false) {
  return async function (req, res, next) {
    try {
      const queryKeys = ['forecastType', 'financialYear', 'trainingProviderId']
      const params = getQueryParams(req, queryKeys, 'companyName')
      res.locals.forecasts = await service.getSummary(
        getAccessToken(req),
        params
      )
      setPageMeta(req, res.locals.forecasts, queryKeys)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function commentContext(req, res, next) {
  res.locals.resourceUrl = `/training-providers/${req.params.id}/forecasts/${req.params.forecastType}/${req.params.year}/${req.params.period}`
  res.locals.resourceName = 'forecast'
  res.locals.resourceSubject = `${capitalize(
    req.params.forecastType
  )} Forecast for ${financialYearFormat(
    req.params.year
  )} - ${financialPeriodFormat(req.params.period)}`
  next()
}

export function setContext(failSilent = false) {
  return async function (req, res, next) {
    try {
      if (req.params.id) {
        req.session.activeTp = req.params.id
      }

      res.locals.activeTp = req.session.activeTp

      if (req.params.year) {
        req.session.activeYearTp = req.params.year
      }
      res.locals.activeYearTp = req.session.activeYearTp

      if (req.params.forecastType) {
        req.session.activeForecastType = req.params.forecastType
      }
      res.locals.activeForecastType = req.session.activeForecastType

      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getAvailableYears(failSilent = false) {
  return async function (req, res, next) {
    try {
      defaultPageLimits(req)
      if (req.params.forecastType) {
        res.locals.forecastType = req.params.forecastType
      }
      res.locals.availableYears = await service.getAvailableYears(
        getAccessToken(req),
        req.params.forecastType,
        req.params.id ? req.params.id : 'all'
      )
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getFinancialYear(failSilent = false) {
  return async function (req, res, next) {
    try {
      defaultPageLimits(req)
      if (!req.params.year) {
        if (res.locals.currentPaymentSchedule) {
          req.params.year = res.locals.currentPaymentSchedule.financialYear
        } else {
          req.params.year = new Date().getFullYear()
        }
      }
      res.locals.forecastType = req.params.forecastType
      res.locals.financialYear = await service.getFinancialYear(
        getAccessToken(req),
        req.params.forecastType,
        req.params.id,
        req.params.year
      )
      res.locals.financialYear.meta = { year: req.params.year }
      res.locals.activeTp = req.params.id
      req.session.activeTp = req.params.id
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getPeriod(failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.forecastType = req.params.forecastType
      res.locals.period = await service.getPeriodByTpId(
        getAccessToken(req),
        req.params.forecastType,
        req.params.id,
        req.params.year,
        req.params.period
      )
      res.locals.activeTp = req.params.id
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getPeriodItems(failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getQueryParams(req, [], '', 20)
      res.locals.items = await service.getPeriodItems(
        getAccessToken(req),
        req.params.forecastType,
        req.params.id,
        req.params.year,
        req.params.period,
        params
      )
      setPageMeta(req, res.locals.items)
      res.locals.items.meta.year = req.params.year
      res.locals.items.meta.period = req.params.period
      next()
    } catch (err) {
      res.locals.items = {}
      setPageMeta(req, res.locals.items)
      res.locals.items.meta.year = req.params.year
      res.locals.items.meta.period = req.params.period
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getPeriodSummaryItems(failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getQueryParams(req, [], '', 20)
      res.locals.items = await service.getPeriodSummaryItems(
        getAccessToken(req),
        req.params.forecastType,
        req.params.id,
        req.params.year,
        req.params.period,
        params
      )
      setPageMeta(req, res.locals.items)
      res.locals.items.meta.year = req.params.year
      res.locals.items.meta.period = req.params.period
      next()
    } catch (err) {
      res.locals.items = {}
      setPageMeta(req, res.locals.items)
      res.locals.items.meta.year = req.params.year
      res.locals.items.meta.period = req.params.period
      handleLookupError(err, next, failSilent)
    }
  }
}

const statusMap = {
  pending: 'revert to pending',
  approved: 'approve'
}

export function setStatusContext(req, res, next) {
  const status = req.params.status
  res.locals.trainingProviderId = req.params.id
  res.locals.entityName =
    req.params.year +
    ' annual forecast for ' +
    res.locals.trainingProvider.companyName
  res.locals.entityType = 'forecast'
  res.locals.year = req.params.year
  res.locals.period = req.params.period
  res.locals.statusText = statusMap[status]
  res.locals.statusAction = capitalize(status)
  res.locals.cancel
  next()
}

export async function updateStatus(req, res, next) {
  const redirect = `/training-providers/${req.params.id}/forecasts/${req.params.forecastType}/${req.params.year}`
  try {
    await service.updateStatus(
      getAccessToken(req),
      req.params.forecastType,
      req.params.id,
      req.params.year,
      0,
      res.locals.statusAction
    )
    res.redirect(redirect)
  } catch (err) {
    logger.error('updateStatus: error ', err)
    handleApiError(req, res, next, err, 'status/confirm')
  }
}
