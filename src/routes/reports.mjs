import express from 'express'
import { useView } from '../controllers/common.js'

const router = new express.Router()
const templateBase = 'reporting'

router.get('/', useView(`${templateBase}/summary`))
router.get('/continuing-trainee-report', useView(`${templateBase}/reportTypes/continuing-trainee-report`))
router.get('/monthly-trainee-report', useView(`${templateBase}/reportTypes/monthly-trainee-report`))

export default router