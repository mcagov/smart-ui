import express from 'express'
import { getContinuingTraineeReport, downloadReport, checkReportExists, getMonthlyTraineeReportSummary, getFailuresReport, getInvoiceReport, getTraineesDemographicReport, getStateAidReport } from '../controllers/reports.js'

const router = new express.Router()

router.put('/continuing-trainee-report', getContinuingTraineeReport())
router.put('/monthly-trainee-report', getMonthlyTraineeReportSummary())
router.put('/failures-report', getFailuresReport())
router.put('/invoice-report', getInvoiceReport())
router.put('/trainees-demographic-report', getTraineesDemographicReport())
router.put('/state-aid-report', getStateAidReport())
router.get('/:reportType/download', downloadReport())
router.head('/:reportType', checkReportExists())

export default router
