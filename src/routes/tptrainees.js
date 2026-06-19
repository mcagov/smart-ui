import express from 'express'
import validators from '../validators/commonvalidator.js'
import { getTrainee, getTraineesByTrainingProviderId, getAllTraineesClaims, getAllTraineesForecasts } from '../controllers/lookups/trainees.js'

import { useView } from '../controllers/common.js'
import controller from '../controllers/tptrainees.js'
import absences from './absences.js'
import attachments from './attachments.js'
import comments from './comments.js'
import enrolments from './enrolments.js'
import { all } from '../controllers/providers.js'
import { check } from 'express-validator'
import { isAb } from '../controllers/auth.js'

const transferValidator = [
  check('trainingProvider', 'Select a training provider').not().isEmpty().trim()
]

const router = new express.Router({ mergeParams: true })

const templateDir = 'tptrainees'

router.get('/', getTraineesByTrainingProviderId(), useView(`${templateDir}/trainees`))
router.get('/create', controller.createTrainee, useView(`${templateDir}/details`))
router.post('/create', validators.traineeDetailsValidator, controller.createTrainee, controller.updateTraineeDetails())

router.use('/:traineeId', getTrainee())

router.get('/:traineeId', useView(`${templateDir}/trainee`))

router.get('/:traineeId/details', useView(`${templateDir}/details`))
router.post('/:traineeId/details', validators.traineeDetailsValidator, controller.updateTraineeDetails())
router.get('/:traineeId/address', useView(`${templateDir}/address`))
router.post('/:traineeId/address', validators.addressValidator, controller.updateTraineeAddressDetails())
router.get('/:traineeId/summary', useView(`${templateDir}/summary`))

router.get('/:traineeId/remove-client-company', useView(`${templateDir}/remove-client-company`))
router.post('/:traineeId/remove-client-company', controller.removeClientCompany())

router.get('/:traineeId/status/review', controller.statusContext('start reviewing', 'Review'), useView('status/confirm'))
router.post('/:traineeId/status/review', controller.statusContext('start reviewing', 'Review'), controller.updateTraineeStatus())

router.get('/:traineeId/status/activate', controller.statusContext('activate', 'Active'), useView('status/confirm'))
router.post('/:traineeId/status/activate', controller.statusContext('activate', 'Active'), controller.updateTraineeStatus())

router.get('/:traineeId/status/activate', controller.statusContext('activate', 'Active'), useView('status/confirm'))
router.post('/:traineeId/status/activate', controller.statusContext('activate', 'Active'), controller.updateTraineeStatus())

router.get('/:traineeId/status/activate', controller.statusContext('activate', 'Active'), useView('status/confirm'))
router.post('/:traineeId/status/activate', controller.updateTraineeStatus())

router.get('/:traineeId/delete',
  controller.statusContext('delete', 'Delete'),
  useView('status/confirm')
)

router.post('/:traineeId/delete', controller.deleteTrainee)

router.get('/:traineeId/status/deactivate', controller.statusContext('deactivate', 'Deactivated'), useView('status/confirm'))
router.post('/:traineeId/status/deactivate', controller.statusContext('deactivate', 'Deactivated'), controller.updateTraineeStatus())

router.get('/:traineeId/transfer', all(), useView(`${templateDir}/transfer`))
router.post('/:traineeId/transfer', all(), transferValidator, controller.transfer)

router.use('/:traineeId/absences', absences)

router.use('/:traineeId/comments', controller.resourceContext)
router.use('/:traineeId/comments', comments)

router.use('/:traineeId/attachments', controller.resourceContext)
router.use('/:traineeId/attachments', attachments)

router.use('/:traineeId/enrolments', enrolments)

router.get('/:traineeId/claims', getAllTraineesClaims(), useView(`${templateDir}/claims`))
router.get('/:traineeId/monthly-forecasts', getAllTraineesForecasts('Monthly'), useView(`${templateDir}/forecasts`))
router.get('/:traineeId/annual-forecasts', getAllTraineesForecasts('Annual'), useView(`${templateDir}/forecasts`))

export default router
