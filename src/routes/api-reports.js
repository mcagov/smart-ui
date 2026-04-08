import express from 'express'
import { getContinuingTraineeReport, downloadReport, checkReportExists, getMonthlyTraineeReportSummary, getFailuresReport, getInvoiceReport, getTraineesDemographicReport } from '../controllers/reports.js'

const router = new express.Router()

router.put('/continuing-trainee-report', getContinuingTraineeReport())
router.put('/monthly-trainee-report', getMonthlyTraineeReportSummary())
router.put('/failures-report', getFailuresReport())
router.put('/invoice-report', getInvoiceReport())
router.put('/trainees-demographic-report', getTraineesDemographicReport())
router.get('/:reportType/download', downloadReport())
router.head('/:reportType', checkReportExists())

export default router
