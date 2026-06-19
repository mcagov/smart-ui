import express from 'express'
import { getTPTraining, getTPTrainings } from '../controllers/lookups/tptrainings.js'
import { getTrainingDropdown, getTrainingItem, getTrainingItems, getTrainingRates } from '../controllers/lookups/trainingitems.js'
import { getEnrolments } from '../controllers/lookups/trainees.js'
import { useView } from '../controllers/common.js'
import controller from '../controllers/tptrainings.js'

const router = new express.Router({ mergeParams: true })

const templateDir = 'tptrainings'

router.get('/', getTPTrainings(), useView(`${templateDir}/trainings`))

router.get('/create', getTrainingDropdown(), useView(`${templateDir}/create-training`))
router.post('/create', getTrainingItems(), controller.createTraining)

router.use('/:trainingId', getTPTraining())

router.get('/:trainingId', useView(`${templateDir}/training`))

router.get('/:trainingId/change-status', useView(`${templateDir}/status-confirm`))
router.post('/:trainingId/change-status', controller.changeStatus)

router.get('/:trainingId/summary', getTrainingItem, getTrainingRates, useView(`${templateDir}/summary`))

router.get('/:trainingId/trainees', getEnrolments(), useView(`${templateDir}/trainees`))

export default router
