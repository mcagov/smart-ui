import express from 'express'
import moment from 'moment'
import { check } from 'express-validator'
import {
  getNextRunDate,
  getOverride,
  getReview,
  list,
  removeRetention,
  retain,
  review,
  setRetainDefaults,
  setReturnUrl,
  undoReview
} from '../controllers/trainee-retention-review.mjs'
import { readDate, useView } from '../controllers/common.js'
import { getTrainee } from '../controllers/lookups/trainees.js'

const router = new express.Router()
const templateBase = 'trainee-retention-review'

const retainValidator = [
  check('reason', 'Enter a reason for retaining the trainee').trim().not().isEmpty(),
  // getNextRunDate has set res.locals.nextRunDate
  check('extendedUntil-day').custom((_, { req }) => {
    const date = readDate('extendedUntil', req.body)
    if (!date || !date.isValid()) {
      throw new Error('Enter a real date to retain the trainee until')
    }
    const nextRunDate = req.res.locals.nextRunDate
    if (date.isBefore(nextRunDate, 'day')) {
      throw new Error(`Date to retain the trainee until must be on or after ${moment(nextRunDate).format('D MMMM YYYY')}, the next deletion run`)
    }
    return true
  })
]

router.get('/', list, useView(`${templateBase}/list`))

router.use('/:traineeId', getTrainee(), setReturnUrl)

router.get('/:traineeId/retain', getOverride(), getNextRunDate, setRetainDefaults, useView(`${templateBase}/retain`))
router.post('/:traineeId/retain', getOverride(), getNextRunDate, retainValidator, retain)

router.get('/:traineeId/review', useView(`${templateBase}/review`))
router.post('/:traineeId/review', review)

router.get('/:traineeId/remove-retention', getOverride(true), useView(`${templateBase}/remove-retention`))
router.post('/:traineeId/remove-retention', removeRetention)

router.get('/:traineeId/undo-review', getReview, useView(`${templateBase}/undo-review`))
router.post('/:traineeId/undo-review', undoReview)

export default router
