import express from 'express'
import { traineeSearch } from '../controllers/lookups/trainees.js'
import { useJson } from '../controllers/common.js'
import { all as allCompanies } from '../controllers/client-companies.mjs'
import { getContinuingTraineeReport, getMonthlyTraineeReportSummary } from '../controllers/reports.js'


const router = new express.Router()

router.get('/trainees/autocomplete', traineeSearch(), useJson('trainees'))

router.get('/client-companies', allCompanies, useJson('clientCompanies'))

router.put('/reports/continuing-trainee-report', getContinuingTraineeReport())

router.put('/reports/monthly-trainee-report', getMonthlyTraineeReportSummary())

export default router
