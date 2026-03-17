import express from 'express'
import { getContinuingTraineeReport, downloadContinuingTraineeReport } from '../controllers/reports.js'

const router = new express.Router()

router.put('/continuing-trainee-report', getContinuingTraineeReport())
router.get('/continuing-trainee-report/download', downloadContinuingTraineeReport())

export default router
