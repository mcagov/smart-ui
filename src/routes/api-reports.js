import express from 'express'
import { getContinuingTraineeReport, checkReportExists } from '../controllers/reports.js'

const router = new express.Router()

router.put('/continuing-trainee-report', getContinuingTraineeReport())
router.head('/:reportType', checkReportExists())

export default router