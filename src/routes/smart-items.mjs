import express from 'express'
import {
  addRate,
  all,
  create,
  createNew,
  get,
  update,
  validateRate
} from '../controllers/smart-items.mjs'
import { redirectAfterPost, useView } from '../controllers/common.js'
import { body } from 'express-validator'

const router = new express.Router()
const templateBase = 'smart-items'

const validation = [
  body('description', 'Enter a description').notEmpty().trim().escape(),
  body('paymentType', 'Choose a payment type of Instalment or Weekly')
    .isIn(['Instalment', 'Weekly', 'Single Payment', 'On Completion'])
    .custom((value, { req }) => {
      if ( // uuid of SMarT 1
        req.body.smartCategory === 'f8759d4e-d691-4893-a1f2-e033ba4b0894' &&
        req.body.paymentType === 'Instalment'
      ) {
        throw new Error('SMarT 1 cannot have a payment type of Instalment')
      }
      return true
    }),
  body('itemOrder', 'Enter a whole number').notEmpty().trim().isInt(),
  body('status', 'Choose a status of Active or Deactivated').isIn([
    'Active',
    'Deactivated'
  ]),
  body('numberOfInstalments', 'Enter a whole number greater than 1')
    .notEmpty()
    .trim()
    .isInt({ min: 1 })
    .custom((value, { req }) => {
      if (['Instalment', 'Weekly'].includes(req.body.paymentType)) {
        if (parseInt( value) < 2) {
          throw new Error(
            'Number of instalments must be at least 2 when payment type is ' +
              req.body.paymentType
          )
        }
      }

      if (['Single Payment', 'On Completion'].includes(req.body.paymentType)) {
        if (parseInt(value) !== 1) {
          throw new Error(
            'Number of instalments must be 1 when payment type is ' +
              req.body.paymentType
          )
        }
      }

      return true
    })
]

router.get('/', all, useView(`${templateBase}/list`))
router.get('/create', createNew, useView(`${templateBase}/details`))
router.post('/create', validation, create, redirectAfterPost)
router.get('/:id', get, useView(`${templateBase}/summary`))
router.get('/:id/details', get, useView(`${templateBase}/details`))
router.post('/:id/details', validation, update, redirectAfterPost)
router.get('/:id/rates', get, useView(`${templateBase}/rates`))
router.post('/:id/rates', get, validateRate(), addRate, redirectAfterPost)
export default router
