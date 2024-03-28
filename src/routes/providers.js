import express from 'express'
import { check } from 'express-validator'
import controller, { auditContext } from '../controllers/providers.js'
import validators from '../validators/commonvalidator.js'
import { useView } from '../controllers/common.js'
import { getEnrolments } from '../controllers/lookups/providers.js'
import { getAbsences } from '../controllers/absences.js'
import claims from './tpclaims.js'
import comments from './comments.js'
import attachments from './attachments.js'
import forecasts from './forecasts.js'
import { allContext } from '../controllers/attachments.js'
import { getEnrolmentsTraining } from '../controllers/enrolments.js'
import paymentSchedules from './payment-schedules.mjs'

const router = new express.Router()

const companyDetailsValidator = [
  check('company-name', 'Enter a company name with more than 3 characters').not().isEmpty().trim().isLength({ min: 3 }),
  check('company-number', 'Enter a company number between 6 and 8 digits').not().isEmpty().trim().isLength({
    min: 6,
    max: 8
  }),
  check('phone-number', 'Enter a phone number with at least 11 digits').not().isEmpty().trim().isLength({ min: 11 }),
  check('max-trainees', 'Enter a number less than 32000').not().isEmpty().trim().isInt({ max: 32767 }),
  check('email', 'Enter an email with at least 3 characters').not().isEmpty().trim().isLength({ min: 3 }).optional({ checkFalsy: true })
]

const representativeValidator = [
  check('representative', 'Enter the representative\'s name with more than 3 characters ').not().isEmpty().trim().isLength({ min: 3 }),
  check('rep-contact-number', 'Enter a contact number with at least 11 digits').not().isEmpty().trim().isLength({ min: 11 }).optional({ checkFalsy: true }),
  check('liaison-officer', 'Enter the liaison officer\'s name with more than 3 characters').not().isEmpty().trim().isLength({ min: 3 }).optional({ checkFalsy: true }),
  check('lo-contact-number', 'Enter a contact number with at least 11 digits').not().isEmpty().trim().isLength({ min: 11 }).optional({ checkFalsy: true }),
  check('training-officer', 'Enter the representative\'s name with more than 3 characters ').not().isEmpty().trim().isLength({ min: 3 }).optional({ checkFalsy: true }),
  check('to-contact-number', 'Enter a contact number with at least 11 digits').not().isEmpty().trim().isLength({ min: 11 }).optional({ checkFalsy: true })
]

const bankingValidator = [
  check('sort-code', 'Enter the sort code with 6 digits').not().isEmpty().trim().isNumeric().isLength({
    min: 6,
    max: 6
  }),
  check('account-number', 'Enter the account number must between 6 and 8 digits').not().isEmpty().trim().isLength({ min: 3 })
]

router.get('/', controller.trainingProvidersPage)
router.get('/create', controller.createTrainingProvider, useView('providers/details'))
router.post('/create', controller.createTrainingProvider, companyDetailsValidator, controller.updateDetails)

router.get('/:id', useView('providers/training-provider'))

router.use('/:id/payment-schedules', paymentSchedules)

router.get('/:id/company', useView('providers/company'))
router.get('/:id/details', useView('providers/details'))
router.post('/:id/details', companyDetailsValidator, controller.updateDetails)
router.get('/:id/representative', useView('providers/representative'))
router.post('/:id/representative', representativeValidator, controller.updateRepresentativeDetails)
router.get('/:id/address', useView('providers/address'))
router.post('/:id/address', validators.addressValidator, controller.updateAddressDetails)
router.get('/:id/banking', useView('providers/banking'))
router.post('/:id/banking', bankingValidator, controller.updateBankingDetails)

router.get('/:id/enrolments', getEnrolmentsTraining(), getEnrolments(), useView('providers/enrolments'))
router.get('/:id/absences', getAbsences(), useView('absences/list'))

router.get('/:id/summary', useView('providers/summary'))

// TODO this should be a post
router.get('/:id/status/:status', controller.updateStatus)

// Wire in other routers

router.use('/:id/claims', claims)
router.use('/:id/forecasts', forecasts)

// router.use('/:id/comments', resourceContext)
router.use('/:id/comments', comments)

router.get('/:id/audit', useView('providers/audit'))
router.use('/:id/audit/attachments', auditContext)
router.use('/:id/audit/attachments', attachments)

router.use('/:id/attachments', allContext)
router.use('/:id/attachments', attachments)

export default router
