import express from 'express'
import { useView } from '../controllers/common.js'

const router = new express.Router()
const templateBase = 'reporting'

router.get('/', useView(`${templateBase}/summary`))

export default router