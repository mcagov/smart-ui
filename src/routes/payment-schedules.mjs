import express from 'express'
import { getAvailableYears, getByYear, getCurrentPaymentSchedule } from '../controllers/payment-schedules.mjs'
import { useView } from '../controllers/common.js'

const router = new express.Router()
const templateBase = 'payment-schedules'

router.get('/', getCurrentPaymentSchedule(), getAvailableYears(), getByYear, useView(`${templateBase}/list`))

export default router
