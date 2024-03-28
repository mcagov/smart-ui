import express from 'express'
import { useView } from '../controllers/common.js'
import { create, update, getAbsence, getAbsences } from '../controllers/absences.js'
import { check } from 'express-validator'

const router = new express.Router({ mergeParams: true })

const templateDir = 'absences'
const absenceValidator = [
  check('start-date-day', 'Enter a day between 1 and 31').not().isEmpty().trim().isInt({ min: 1, max: 31 }),
  check('start-date-month', 'Enter a month between 1 and 12').not().isEmpty().trim().isInt({ min: 1, max: 12 }),
  check('start-date-year', 'Enter a year which is greater that 2000').not().isEmpty().trim().isInt({
    min: 2010,
    max: 2050
  }),
  check('duration', 'Enter the duration of the absence').not().isEmpty().trim()
]

router.get('/', getAbsences(), useView(`${templateDir}/absences`))
router.get('/create', useView(`${templateDir}/details`))
router.post('/create', absenceValidator, create)
router.use('/:absenceId', getAbsence())
router.get('/:absenceId', useView(`${templateDir}/absence`))
router.get('/:absenceId/details', useView(`${templateDir}/details`))
router.post('/:absenceId/details', absenceValidator, update)

export default router
