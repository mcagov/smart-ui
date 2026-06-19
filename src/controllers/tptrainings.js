import { getAccessToken } from '../utils.js'
import { logger } from '@mca/common-logger'
import TrainingProviderTrainings from '../services/trainingprovidertrainings.js'

const trainingService = new TrainingProviderTrainings()

async function createTraining (req, res, next) {
  try {
    await trainingService
      .create(getAccessToken(req), {
        trainingProviderId: req.params.id,
        trainingItemId: req.body['training-item'],
        status: 'Active'
      })
    res.redirect(`/training-providers/${req.params.id}/trainings?status=Active`)
  } catch (err) {
    logger.error(err)
    next(err)
  }
}

async function changeStatus (req, res, next) {
  const training = res.locals.trainingProviderTraining

  try {
    await trainingService
      .put(getAccessToken(req), req.params.trainingId, {
        trainingProviderId: req.params.id,
        trainingItemId: training.trainingItem.id,
        status: training.status === 'Active' ? 'Deactivated' : 'Active'
      })
    res.redirect(`/training-providers/${req.params.id}/trainings?status=Active`)
  } catch (err) {
    logger.error(err)
    next(err)
  }
}

export default {
  createTraining,
  changeStatus
}
