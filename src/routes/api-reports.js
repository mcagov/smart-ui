import express from 'express'
import { getContinuingTraineeReport, downloadContinuingTraineeReport, getMonthlyTraineeReportSummary } from '../controllers/reports.js'

const router = new express.Router()

router.put('/continuing-trainee-report', getContinuingTraineeReport())
router.get('/continuing-trainee-report/download', downloadContinuingTraineeReport())
router.put('/monthly-trainee-report', getMonthlyTraineeReportSummary())

export default router
