import express from 'express'
import { useView } from '../controllers/common.js'
import { getEnrolment, getEnrolments } from '../controllers/lookups/providers.js'
import {
  adminUpdateEnrolment,
  changeLeaveStatus,
  deleteEnrolment,
  enrolTrainee,
  getEnrolmentsTraining,
  getTraining,
  updateEnrolment,
  reactivate,
  rejectTransfer
} from '../controllers/enrolments.js'
import { check } from 'express-validator'
import { isAb, isSa } from '../controllers/auth.js'
import moment from 'moment'
import { parseDate } from '../utils.js'

const router = new express.Router({ mergeParams: true })

const createValidator = [
  check('discipline', 'Select a discipline').not().isEmpty().trim(),
  check('level', 'Select a level').not().isEmpty().trim(),
  check('experienced', 'Select yes if the trainee has experience').not().isEmpty().trim(),
  check('graduate', 'Select yes if the trainee is a graduate').not().isEmpty().trim(),

  check('start-date-day', 'Enter a start day between 1 and 31').not().isEmpty().trim().isInt({ min: 1, max: 31 }),
  check('start-date-month', 'Enter a start month between 1 and 12').not().isEmpty().trim().isInt({ min: 1, max: 12 }),
  check('start-date-year', 'Enter a start year which is greater that 2000').not().isEmpty().trim().isInt({
    min: 2000,
    max: 2050
  }),
  check('end-date-day', 'Enter an end day between 1 and 31').not().isEmpty().trim().isInt({ min: 1, max: 31 }).optional({ checkFalsy: true }),
  check('end-date-month', 'Enter an end month between 1 and 12').not().isEmpty().trim().isInt({ min: 1, max: 12 }).optional({ checkFalsy: true }),
  check('end-date-year', 'Enter an end year which is greater that 2000').not().isEmpty().trim().isInt({
    min: 2000,
    max: 2050
  }).custom(
    (value, { req }) => {
      const year = req.body['end-date-year']
      const month = req.body['end-date-month']
      const day = req.body['end-date-day']

      const endDate = moment([year, month - 1, day])

      console.log(`checking date: ${endDate}`)
      if (!endDate.isValid()) {
        throw new Error('Please enter a valid end date')
      }

      return true
    }).optional({ checkFalsy: true })
]

const updateValidator = [

  check('start-date-day', 'Enter a start day between 1 and 31').optional().trim().isInt({ min: 1, max: 31 }),
  check('start-date-month', 'Enter a start month between 1 and 12').optional().trim().isInt({ min: 1, max: 12 }),
  check('start-date-year', 'Enter a start year which is greater that 2000').optional().trim().isInt({
      min: 2000,
      max: 2050
    }).custom(
    (value, { req }) => {
      return parseDate('start-date', req.body).isValid()
    }).withMessage('Please ensure the start date is valid'),
  check('end-date-day', 'Enter an end day between 1 and 31').not().isEmpty().trim().isInt({ min: 1, max: 31 }).optional({ checkFalsy: true }),
  check('end-date-month', 'Enter an end month between 1 and 12').not().isEmpty().trim().isInt({ min: 1, max: 12 }).optional({ checkFalsy: true }),
  check('end-date-year', 'Enter an end year which is greater that 2000').not().isEmpty().trim().isInt({
      min: 2000,
      max: 2050
    }).custom(
    (value, { req }) => {
      return parseDate('end-date', req.body).isValid()
    }).withMessage('Please ensure the end date is valid')
        .optional({ checkFalsy: true }),
  check('noe-issued-date-day', 'Enter an end day between 1 and 31').not().isEmpty().trim().isInt({ min: 1, max: 31 }).optional({ checkFalsy: true }),
  check('noe-issued-date-month', 'Enter an end month between 1 and 12').not().isEmpty().trim().isInt({ min: 1, max: 12 }).optional({ checkFalsy: true }),
  check('noe-issued-date-year', 'Enter an end year which is greater that 2000').not().isEmpty().trim().isInt({
      min: 2000,
      max: 2050
    }).custom(
    (value, { req }) => {
      return parseDate('noe-issued-date', req.body).isValid()
    }).withMessage('Please ensure the NoE date is valid')
        .optional({ checkFalsy: true }),
  check('coc-issued-date-day', 'Enter an end day between 1 and 31').not().isEmpty().trim().isInt({ min: 1, max: 31 }).optional({ checkFalsy: true }),
  check('coc-issued-date-month', 'Enter an end month between 1 and 12').not().isEmpty().trim().isInt({ min: 1, max: 12 }).optional({ checkFalsy: true }),
  check('coc-issued-date-year', 'Enter an end year which is greater that 2000').not().isEmpty().trim().isInt({
      min: 2000,
      max: 2050
    }).custom(
    (value, { req }) => {
      return parseDate('coc-issued-date', req.body).isValid()
    }).withMessage('Please ensure the CoC date is valid')
    .optional({ checkFalsy: true })
]

const templateDir = 'enrolments'

router.get('/', getEnrolmentsTraining(), getEnrolments(), useView(`${templateDir}/enrolments`))
router.get('/create', useView(`${templateDir}/create`))
router.post('/create', createValidator, getTraining, enrolTrainee)

router.use('/:enrolmentId', getEnrolment())
router.get('/:enrolmentId', useView(`${templateDir}/enrolment`))
router.post('/:enrolmentId', updateValidator, updateEnrolment)

router.get('/:enrolmentId/details', useView(`${templateDir}/details`))

router.get('/:enrolmentId/delete', isAb, useView(`${templateDir}/delete`))
router.post('/:enrolmentId/delete', isAb, deleteEnrolment)

router.get('/:enrolmentId/admin-update', isSa, useView(`${templateDir}/admin-update`))
router.post('/:enrolmentId/admin-update', isSa, updateValidator, adminUpdateEnrolment)

router.get('/:enrolmentId/changeLeaveStatus',  isAb, useView(`${templateDir}/change-leave-status`))
router.post('/:enrolmentId/changeLeaveStatus', isAb, changeLeaveStatus)

router.get('/:enrolmentId/reactivateLeaveStatus',  isAb, useView(`${templateDir}/reactivate-status`))
router.post('/:enrolmentId/reactivateLeaveStatus', isAb, reactivate)

router.get('/:enrolmentId/rejectTransfer',  isAb, useView(`${templateDir}/reject-transfer`))
router.post('/:enrolmentId/rejectTransfer', isAb, rejectTransfer)

export default router
