import express from 'express'
import { body } from 'express-validator'
import { useView } from '../controllers/common.js'
import { create, update, del, getAdjustment, getAdjustments, getAvailableYears, getTraining } from '../controllers/forecasts-adjustments.js'
import { getPaymentSchedules } from '../controllers/forecasts.js'

const router = new express.Router({ mergeParams: true })

const createValidator = [
  body('financialYear', 'Select a financial year').not().isEmpty().trim(),
  body('financialPeriod', 'Select a financial period').not().isEmpty().trim().isInt({ min: 1, max: 12 }),
  body('smartCategory', 'Select a smart category').not().isEmpty().trim(),
  body('trainingId', 'Select a training item').not().isEmpty().trim(),
  body('traineeCount', 'Enter the number of joiners').not().isEmpty().trim().isInt()
]

const updateValidator = [
  body('traineeCount', 'Enter the number of joiners').not().isEmpty().trim().isInt()
]

router.get('/create', getAvailableYears(), getPaymentSchedules(), getTraining, useView('adjustments/create'))
router.post('/create', createValidator, getPaymentSchedules(), getAvailableYears(), getTraining, create)
router.get('/:year?', getAvailableYears(), getAdjustments(), useView('adjustments/list'))
router.get('/:year/:period/:trainingId', getAdjustment(), getAvailableYears(), getTraining, useView('adjustments/update'))
router.post('/:year/:period/:trainingId', updateValidator, getAdjustment(), getAvailableYears(), getTraining, update)
router.get('/:year/:period/:trainingId/delete', getAdjustment(), getAvailableYears(), getTraining, useView('adjustments/delete-confirm'))
router.post('/:year/:period/:trainingId/delete', del)

export default router
