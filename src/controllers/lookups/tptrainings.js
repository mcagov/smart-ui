import TrainingProviderTrainings from '../../services/trainingprovidertrainings.js'
import { getQueryParams, handleLookupError, setPageMeta } from './common.js'
import assert from 'assert'
import { getAccessToken } from '../../utils.js'

const trainingProviderTrainings = new TrainingProviderTrainings()

export function getTPTraining (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.trainingId, 'req.params.trainingId is not set')
      res.locals.trainingProviderTraining = await trainingProviderTrainings.get(getAccessToken(req), req.params.trainingId)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTPTrainings (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.id, 'req.params.id is not set')
      const queryKeys = ['searchText', 'status']
      const params = getQueryParams(req, queryKeys)
      params.trainingProviderId = req.params.id
      res.locals.trainingProviderTrainings =
        await trainingProviderTrainings.all(getAccessToken(req), params)
      setPageMeta(req, res.locals.trainingProviderTrainings, queryKeys)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}
