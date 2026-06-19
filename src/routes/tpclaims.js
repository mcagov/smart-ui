import express from 'express'
import { useView } from '../controllers/common.js'
import { getPeriod, getPeriodItems, getFinancialYear, commentContext, create, setStatusContext, updateStatus, getTraineesWithClaims, forwardTraineeClaims, getTraineeClaims, createBalancingClaim, getBalancingClaim, updateBalancingClaim, deleteBalancingClaim, createOtherClaim, getOtherClaim, updateOtherClaim, deleteOtherClaim, getBcTraineesDropDown, getBcTrainingDropDown} from '../controllers/claims.js'
import { getTrainee } from '../controllers/lookups/trainees.js'
import comments from './comments.js'
import { getCurrentPaymentSchedule, getPaymentSchedule } from '../controllers/payment-schedules.mjs'
import { isAb } from '../controllers/auth.js'
import { check } from 'express-validator'

const router = new express.Router({ mergeParams: true })
const basePath = '/years/:year/periods/:period'

const otherClaimValidator = [
  check('ocPaymentAmount', 'Enter a decimal amount').not().isEmpty().trim().isDecimal(),
  check('ocComment', 'Enter a comment').not().isEmpty().trim()
]

const bcValidator = [
  check('bcAmount', 'Enter a decimal amount').not().isEmpty().trim().isDecimal(),
  check('bcComment', 'Enter a comment').not().isEmpty().trim(),
  check('bcWeeksClaimed', 'Enter weeks claimed as whole number, between -5 and 5')
    .optional({ checkFalsy: true, nullable: true })
    .if(value => value !== null)
    .isInt({ min: -5, max: 5 })
]

router.use(getCurrentPaymentSchedule())

router.get('', useView('claims/claims'))
router.get('/years/:year', getFinancialYear(), useView('claims/financial-year'))
// TODO split
router.get(`${basePath}/:viewType(trainee-claims|balancing-claims|other-claims|si-summary)?`, getPaymentSchedule(), getPeriod(true), getPeriodItems(true), useView('claims/period'))
router.post(basePath, create)

// Workflow

router.get(`${basePath}/:status(submitted)`, setStatusContext, useView('status/confirm'))
router.post(`${basePath}/:status(submitted)`, setStatusContext, updateStatus)

router.get(`${basePath}/:status(reviewing|reviewed|rejected|pending|approved)`, isAb, setStatusContext, useView('status/confirm'))
router.post(`${basePath}/:status(reviewing|reviewed|rejected|pending|approved)`, isAb, setStatusContext, updateStatus)

router.use(`${basePath}/comments`, commentContext, comments)

// balancing claims
router.use(`${basePath}/balancing-claim`, isAb, setStatusContext)

router.get(`${basePath}/balancing-claim/trainee`, getBcTraineesDropDown(), useView('claims/bc-trainee'))
router.post(`${basePath}/balancing-claim/trainee`, forwardTraineeClaims)


router.get(`${basePath}/balancing-claim/trainee/:traineeId`, getTrainee(), getTraineeClaims(), useView('claims/bc-trainee-claims'))
router.post(`${basePath}/balancing-claim/trainee/:traineeId`, bcValidator, getTrainee(), getTraineeClaims(), createBalancingClaim)

router.get(`${basePath}/balancing-claim/trainee-no-claim/:traineeId`, getTrainee(), getBcTrainingDropDown(), useView('claims/bc-trainee-no-claims'))
router.post(`${basePath}/balancing-claim/trainee-no-claim/:traineeId`, bcValidator, getTrainee(), getBcTrainingDropDown(), createBalancingClaim)

router.get(`${basePath}/balancing-claim/trainee/:traineeId/:balancingClaimId`, getBalancingClaim(), getTrainee(), getTraineeClaims(), getBcTrainingDropDown(), useView('claims/bc-trainee-no-claims'))
router.post(`${basePath}/balancing-claim/trainee/:traineeId/:balancingClaimId`, bcValidator, getBalancingClaim(), getTrainee(), getTraineeClaims(), getBcTrainingDropDown(), updateBalancingClaim)

router.get(`${basePath}/balancing-claim/trainee/:traineeId/:balancingClaimId/delete`, getBalancingClaim(), getTrainee(), getTraineeClaims(), useView('claims/bc-delete-confirm'))
router.post(`${basePath}/balancing-claim/trainee/:traineeId/:balancingClaimId/delete`, getBalancingClaim(), getTrainee(), getTraineeClaims(), deleteBalancingClaim)

// Other claims
router.use(`${basePath}/other-claim`, isAb, setStatusContext)
router.get(`${basePath}/other-claim/add`, useView('claims/oc-add'))
router.post(`${basePath}/other-claim/add`, otherClaimValidator, createOtherClaim)
router.get(`${basePath}/other-claim/:otherClaimId`, getOtherClaim(), useView('claims/oc-add'))
router.post(`${basePath}/other-claim/:otherClaimId`, otherClaimValidator, getOtherClaim(), updateOtherClaim)

router.get(`${basePath}/other-claim/:otherClaimId/delete`, getOtherClaim(), useView('claims/oc-delete-confirm'))
router.post(`${basePath}/other-claim/:otherClaimId/delete`, getOtherClaim(), deleteOtherClaim)

export default router
