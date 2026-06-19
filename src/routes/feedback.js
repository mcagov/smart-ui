import express from 'express'
import { check } from 'express-validator'
import controller from '../controllers/feedback.js'

const router = new express.Router()

const validation = [
  check('satisfaction', 'Select how satisfied you are').not().isEmpty(),
  check('summary', 'Enter a summary').not().isEmpty().trim().isLength({ max: 255 }),
  check('description', 'Enter more details').not().isEmpty().trim().isLength({ max: 10000 })
]

router.get('', controller.feedbackPage)
router.post('', validation, controller.postFeedback)

export default router
