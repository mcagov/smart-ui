import express from 'express'
import { getContinuingTraineeReport, downloadReport, checkReportExists, getMonthlyTraineeReportSummary, getFailuresReport, getInvoiceReport, getTraineesDemographicReport, getStateAidReport } from '../controllers/reports.js'
import { REPORT_TYPES } from '../report-types.js'

const router = new express.Router()

router.param('reportType', (req, res, next, reportType) => {
  if (!REPORT_TYPES.includes(reportType)) {
    return res.status(404).json({ error: 'Unknown report type' })
  }
  next()
})

router.put('/continuing-trainee-report', getContinuingTraineeReport())
router.put('/monthly-trainee-report', getMonthlyTraineeReportSummary())
router.put('/failures-report', getFailuresReport())
router.put('/invoice-report', getInvoiceReport())
router.put('/trainees-demographic-report', getTraineesDemographicReport())
router.put('/uk-subsidy-transparency-report', getStateAidReport())
router.get('/:reportType/download', downloadReport())
router.head('/:reportType', checkReportExists())

export default router
