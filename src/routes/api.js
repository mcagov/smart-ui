import express from 'express'
import { traineeSearch } from '../controllers/lookups/trainees.js'
import { useJson } from '../controllers/common.js'
import { all as allCompanies } from '../controllers/client-companies.mjs'

const router = new express.Router()

router.get('/trainees/autocomplete', traineeSearch(), useJson('trainees'))

router.get('/client-companies', allCompanies, useJson('clientCompanies'))

export default router
