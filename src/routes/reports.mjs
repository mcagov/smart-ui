import express from 'express'
import createError from 'http-errors'
import { useView } from '../controllers/common.js'
import { REPORT_TYPES } from '../report-types.js'

const router = new express.Router()
const templateBase = 'reporting'

router.get('/', useView(`${templateBase}/summary`))

// Parameterized route for report types
router.get('/:reportType', (req, res, next) => {
  const { reportType } = req.params
  if (!REPORT_TYPES.includes(reportType)) {
    return next(createError(404))
  }
  res.locals.query = req.query
  res.status(200).render(`${templateBase}/reportTypes/${reportType}`)
})

export default router
