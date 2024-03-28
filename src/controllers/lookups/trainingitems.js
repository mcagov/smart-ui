import TrainingItems from '../../services/training-items.mjs'
import TrainingRates from '../../services/trainingrates.js'
import assert from 'assert'
import { handleLookupError } from './common.js'
import { getAccessToken } from '../../utils.js'

const trainingItem = new TrainingItems()
const trainingRates = new TrainingRates()

export function getTrainingDropdown (failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.trainingItems = await trainingItem.dropdown(getAccessToken(req))
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTrainingItems (failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.trainingItems = await trainingItem.all(getAccessToken(req))
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTrainingRates (failSilent = false) {
  return async function (req, res, next) {
    try {
      const trainingItemId = req.params.trainingItemId
        ? req.params.trainingItemId
        : res.locals.trainingProviderTraining.trainingItemId
      res.locals.trainingRates = await trainingRates.allById(getAccessToken(req), trainingItemId)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTrainingItem (failSilent = false) {
  return async function (req, res, next) {
    try {
      const id = req.params.trainingItemId
        ? req.params.trainingItemId
        : res.locals.trainingProviderTraining.trainingItem.id

      assert.ok(id, 'training item id is not set')
      res.locals.trainingItem = await trainingItem.get(getAccessToken(req), id)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}
