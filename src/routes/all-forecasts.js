import express from 'express'
import { useView } from '../controllers/common.js'
import { search, getSummary, setContext } from '../controllers/forecasts.js'
import { getCurrentPaymentSchedule } from '../controllers/payment-schedules.mjs'

const router = new express.Router({ mergeParams: true })
router.use(setContext())
router.use(getCurrentPaymentSchedule())

router.get('', setContext(), getSummary(), useView('forecasts/summary-list'))
router.get('/pending', setContext(), search(), useView('forecasts/list'))

export default router
