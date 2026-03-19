import express from 'express'
import { useView } from '../controllers/common.js'

const router = new express.Router()
const templateBase = 'reporting'

router.get('/', useView(`${templateBase}/summary`))

// Parameterized route for report types
router.get('/:reportType', (req, res) => {
  const { reportType } = req.params
  res.locals.query = req.query
  res.status(200).render(`${templateBase}/reportTypes/${reportType}`)
})

export default router
