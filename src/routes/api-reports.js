import express from 'express'
import { getContinuingTraineeReport, downloadReport, getMonthlyTraineeReportSummary } from '../controllers/reports.js'

const router = new express.Router()

router.put('/continuing-trainee-report', getContinuingTraineeReport())
router.put('/monthly-trainee-report', getMonthlyTraineeReportSummary())
router.get('/download', downloadReport())
router.head('/:reportType', checkReportExists())

export default router
