import assert from 'assert'
import { validationResult } from 'express-validator'
import TrainingItems from '../services/training-items.mjs'
import { getAccessToken, govUKErrors } from '../utils.js'
import { getQueryParams, setPageMeta, handleLookupError } from './lookups/common.js'

const service = new TrainingItems()
const templateBase = 'training-items'

function buildTrainingItem (req) {
  return {
    description: req.body.description,
    isLegacy: req.body.isLegacy,
    experienceRequired: req.body.experienceRequired,
    levelIds: Array.isArray(req.body.level) ? req.body.level : [req.body.level],
    disciplineIds: Array.isArray(req.body.discipline) ? req.body.discipline : [req.body.discipline],
    status: req.body.activeStatus
  }
}

export async function createNew (req, res, next) {
  res.locals.trainingItem = {}
  next()
}

export async function create (req, res, next) {
  try {
    res.locals.trainingItem = buildTrainingItem(req)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render(`${templateBase}/details`, {
        errors: govUKErrors(errors.errors)
      })
    } else {
      const newEntity = await service.create(getAccessToken(req), res.locals.trainingItem)
      req.params.id = newEntity.id
      next()
    }
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function update (req, res, next) {
  try {
    res.locals.trainingItem = buildTrainingItem(req)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render(`${templateBase}/details`, {
        errors: govUKErrors(errors.errors)
      })
    } else {
      await service.put(getAccessToken(req), req.params.id, res.locals.trainingItem)
      next()
    }
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function updateStatus (req, res, next) {
  try {
    await service.updateStatus(getAccessToken(req), req.params.id, req.body.status)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function get (req, res, next) {
  try {
    assert.ok(req.params.id, 'req.params.id is not set')
    res.locals.trainingItem = await service.get(getAccessToken(req), req.params.id)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function all (req, res, next) {
  try {
    const queryKeys = ['searchText', 'status']
    const params = getQueryParams(req, queryKeys, 'description')
    res.locals.trainingItems = await service.all(getAccessToken(req), params)
    setPageMeta(req, res.locals.trainingItems, queryKeys)
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function addSmartItem (req, res, next) {
  try {
    await service.addSmartItem(
      getAccessToken(req),
      req.params.id,
      req.params.smartItemId
    )
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function delSmartItem (req, res, next) {
  try {
    await service.delSmartItem(
      getAccessToken(req),
      req.params.id,
      req.params.smartItemId
    )
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}
