import express from 'express'
import { useView } from '../controllers/common.js'
import { search } from '../controllers/claims.js'
import { getCurrentPaymentSchedule } from '../controllers/payment-schedules.mjs'

const router = new express.Router({ mergeParams: true })

router.use(getCurrentPaymentSchedule())
router.get('', search(), useView('claims/list'))

export default router
