import Forecasts from '../services/forecasts.js'
import TrainingProviderTrainings from '../services/trainingprovidertrainings.js'
import { getAccessToken, govApiErrorMsg, govUKErrors } from '../utils.js'
import { defaultPageLimits, handleLookupError, getQueryParams, setPageMeta } from './lookups/common.js'
import { logger } from '@mca/common-logger'
import { validationResult } from 'express-validator'
import ForecastAdjustments from '../services/forecasts-adjustments.js'

const service = new ForecastAdjustments()
const serviceForecast = new Forecasts()
const training = new TrainingProviderTrainings()

export async function create (req, res) {
  const redirect = `/training-providers/${req.params.id}/forecasts/adjustments/${req.body.financialYear}`
  try {
    const errors = validationResult(req)
    res.locals.forecastAdjustment = {
      financialYear: req.body.financialYear,
      financialPeriod: req.body.financialPeriod,
      smartCategory: req.body.smartCategory,
      trainingId: req.body.trainingId,
      traineeCount: req.body.traineeCount,
      trainingProviderId: req.params.id
    }
    if (!errors.isEmpty()) {
      res.status(400).render('adjustments/create', {
        errors: govUKErrors(errors.errors),
        forecastAdjustment: res.locals.forecastAdjustment
      })
    } else {
      await service.create(
        getAccessToken(req),
        res.locals.forecastAdjustment)
      res.redirect(redirect)
    }
  } catch (err) {
    res.status(400)
      .render('adjustments/create', { errors: govUKErrors([{ msg: govApiErrorMsg(err) }]) })
  }
}

// only the trainee count can be udpated - the rest is part of the key
export async function update (req, res) {
  const redirect = `/training-providers/${req.params.id}/forecasts/adjustments/${req.params.year}`
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render('adjustments/create', {
        errors: govUKErrors(errors.errors),
        forecastAdjustment: res.locals.forecastAdjustment
      })
    } else {
      await service.put(
        getAccessToken(req),
        req.params.id,
        req.params.year,
        req.params.period,
        req.params.trainingId,
        req.body.traineeCount
      )
      res.redirect(redirect)
    }
  } catch (err) {
    res.status(400)
      .render('adjustments/update', { errors: govUKErrors([{ msg: err.message }]) })
  }
}

export async function del (req, res) {
  const redirect = `/training-providers/${req.params.id}/forecasts/adjustments/${req.params.year}`
  try {
    await service.del(
      getAccessToken(req),
      req.params.id,
      req.params.year,
      req.params.period,
      req.params.trainingId
    )
    res.redirect(redirect)
  } catch (err) {
    res.status(400)
      .render('adjustments/delete-confirm', { errors: govUKErrors([{ msg: err.message }]) })
  }
}

export async function getTraining (req, res, next) {
  // Lookup available training one discipline and level are chosen#

  try {
    updateForecastAdjustment(req, res, [
      'financialYear',
      'financialPeriod',
      'smartCategory',
      'trainingId',
      'traineeCount'])

    if (res.locals.forecastAdjustment.smartCategory) {
      const params = {
        trainingProviderId: req.params.id,
        smartCategory: res.locals.forecastAdjustment.smartCategory,
        status: 'Active',
        limit: 1000
      }
      res.locals.trainings = await training.all(getAccessToken(req), params)
    }
    next()
  } catch (err) {
    logger.warn('Problem calling get trainings for ', err)
    next()
  }
}

function updateForecastAdjustment (req, res, items) {
  if (!res.locals.forecastAdjustment) {
    res.locals.forecastAdjustment = {}
  }
  for (const item of items) {
    if (req.query[item]) {
      res.locals.forecastAdjustment[item] = req.query[item]
    }
  }
}

export function getAvailableYears (failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.availableYears = await serviceForecast.getAvailableYears(
        getAccessToken(req),
        null,
        req.params.id ? req.params.id : 'all'
      )
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getAdjustment (failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.forecastAdjustment = await service.get(
        getAccessToken(req),
        req.params.id,
        req.params.year,
        req.params.period,
        req.params.trainingId)
      res.locals.activeTp = req.params.id
      req.session.activeTp = req.params.id
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getAdjustments (failSilent = false) {
  return async function (req, res, next) {
    try {
      defaultPageLimits(req)
      if (!req.params.year) {
        if (res.locals.availableYears && res.locals.availableYears[0]) {
          req.params.year = res.locals.availableYears[0]
        }
      }
      if (req.params.year) {
        req.query.sort ??= 'training.trainingItem.description'
        // req.query.order ??= 'asc'

        const params = {
          page: req.query.page,
          limit: req.query.limit,
          sort: req.query.sort,
          order: req.query.order
        }

        res.locals.forecastAdjustments = await service.getByYear(
          getAccessToken(req),
          req.params.id,
          req.params.year,
          params)
        res.locals.forecastAdjustments.meta.year = req.params.year
        res.locals.activeTp = req.params.id
        req.session.activeTp = req.params.id
        setPageMeta(req, res.locals.forecastAdjustments)
      }
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getPeriod (failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.forecastType = req.params.forecastType
      res.locals.period = await service
        .getPeriodByTpId(
          getAccessToken(req),
          req.params.forecastType,
          req.params.id,
          req.params.year,
          req.params.period)
      res.locals.activeTp = req.params.id
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getPeriodItems (failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getQueryParams(req, [], '', 20)
      res.locals.items = await service.getPeriodItems(
        getAccessToken(req),
        req.params.forecastType,
        req.params.id,
        req.params.year,
        req.params.period,
        params)
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
