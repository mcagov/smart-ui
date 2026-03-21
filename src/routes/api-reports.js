import express from 'express'
import { getContinuingTraineeReport, downloadReport, getMonthlyTraineeReportSummary } from '../controllers/reports.js'

const router = new express.Router()

router.put('/continuing-trainee-report', getContinuingTraineeReport())
router.get('/download', downloadReport())
router.put('/monthly-trainee-report', getMonthlyTraineeReportSummary())

export default router
