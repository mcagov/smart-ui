import express from 'express'
import comments from './comments.js'
import { useView } from '../controllers/common.js'
import { create, getPeriod, getFinancialYear, getAvailableYears, setContext, getPeriodSummaryItems, commentContext, updateStatus, setStatusContext, getWorkflowLogs } from '../controllers/forecasts.js'
import forecastAdjustments from './forecast-adjustments.js'
import { isAb } from '../controllers/auth.js'
import { getCurrentPaymentSchedule } from '../controllers/payment-schedules.mjs'

const router = new express.Router({ mergeParams: true })

router.use(setContext())
router.use(getCurrentPaymentSchedule())
// TODO cache this
router.use(getAvailableYears())
router.get('', useView('forecasts/forecasts'))
router.use('/adjustments', forecastAdjustments)

router.get(
  '/view-logs',
  setStatusContext,
  getWorkflowLogs(),
  useView('forecasts/view-logs')
)

router.get('/:forecastType(annual)/:year/:status(pending|approved)', isAb, getFinancialYear(), setStatusContext, useView('status/confirm'))
router.post('/:forecastType(annual)/:year/:status(pending|approved)', isAb, getFinancialYear(), setStatusContext, updateStatus)

router.get('/:forecastType(annual|monthly)/:year?', getFinancialYear(), useView('forecasts/financial-year'))
// router.get('/:forecastType(annual|monthly)/:year/:period', getPeriod(true), getPeriodItems(true), useView('forecasts/period'))
router.use('/:forecastType(annual|monthly)/:year/:period/comments', commentContext, comments)
router.get('/:forecastType(annual|monthly)/:year/:period', getPeriod(true), getPeriodSummaryItems(true), useView('forecasts/period'))
router.post('/:forecastType(annual)/:year', create)
router.post('/:forecastType(monthly)/:year/:period', create)

export default router
