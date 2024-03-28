import assert from 'assert'
import SmartItems from '../services/smart-items.mjs'
import { getAccessToken, govUKErrors } from '../utils.js'
import { handleLookupError, getQueryParams, setPageMeta } from './lookups/common.js'
import { body, validationResult } from 'express-validator'
import { createDate, readDate } from './common.js'

const service = new SmartItems()
const templateBase = 'smart-items'

export async function createNew (req, res, next) {
  res.locals.smartItem = {}
  next()
}


export function validateRate () {
  return [
    body('startDate', 'Start date must be a valid date')
      .custom((value, { req }) => {
        const startDate = readDate('startDate', req.body)
        if (!startDate.isValid()) {
          throw new Error('Start date must be a valid date')
        }
        return true
      }),
    body('paymentAmount', 'Payment amount must be a positive money amount')
      .notEmpty().isFloat({ min: 0 }).isDecimal({ decimal_digits: '0,2' })
  ]
}

export async function create (req, res, next) {
  try {
    res.locals.smartItem = {
      description: req.body.description,
      paymentType: req.body.paymentType,
      numberOfInstalments: req.body.numberOfInstalments,
      itemOrder: req.body.itemOrder,
      status: req.body.status,
      smartCategoryId: req.body.smartCategory
    }
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render(`${templateBase}/details`, {
        errors: govUKErrors(errors.errors)
      })
    } else {
      const newEntity = await service.create(getAccessToken(req), res.locals.smartItem)
      req.params.id = newEntity.id
      next()
    }
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function update (req, res, next) {
  try {
    res.locals.smartItem = {
      description: req.body.description,
      paymentType: req.body.paymentType,
      numberOfInstalments: req.body.numberOfInstalments,
      itemOrder: req.body.itemOrder,
      status: req.body.status,
      smartCategoryId: req.body.smartCategory
    }
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render(`${templateBase}/details`, {
        errors: govUKErrors(errors.errors)
      })
    } else {
      await service.put(getAccessToken(req), req.params.id, res.locals.smartItem)
      next()
    }
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function addRate (req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.locals.newRate = {
        paymentAmount: req.body.paymentAmount
      }
      res.locals.newRate['startDate-year'] = req.body['startDate-year']
      res.locals.newRate['startDate-month'] = req.body['startDate-month']
      res.locals.newRate['startDate-day'] = req.body['startDate-day']

      res.status(400).render(`${templateBase}/rates`, {
        errors: govUKErrors(errors.errors)
      })
    } else {
      await service.addRate(
        getAccessToken(req),
        req.params.id,
        createDate('startDate', req.body),
        req.body.paymentAmount
      )
      next()
    }
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function get (req, res, next) {
  try {
    assert.ok(req.params.id, 'req.params.id is not set')
    res.locals.smartItem = await service.get(getAccessToken(req), req.params.id)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function all (req, res, next) {
  try {
    const queryKeys = ['searchText', 'status']
    const params = getQueryParams(req, queryKeys, 'description')
    res.locals.smartItems = await service.all(getAccessToken(req), params)
    setPageMeta(req, res.locals.smartItems, queryKeys)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}
