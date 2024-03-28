import express from 'express'
import { addSmartItem, all, create, createNew, delSmartItem, get, update, updateStatus } from '../controllers/training-items.mjs'
import { all as allSmartItems } from '../controllers/smart-items.mjs'
import { redirectAfterPost, useView } from '../controllers/common.js'
import { check } from 'express-validator'

const router = new express.Router()

const templateBase = 'training-items'

const validator = [
  check('description', 'Enter a description').not().isEmpty().trim(),
  check('isLegacy', 'Select yes if the training item is legacy').not().isEmpty().trim(),
  check('experienceRequired', 'Select yes if experience is required').not().isEmpty().trim(),
  check('discipline', 'Select all the disciplines that apply').not().isEmpty(),
  check('level', 'Select all the levels that apply').not().isEmpty(),
  check('activeStatus', 'Select if the training item is active or inactive').not().isEmpty().trim()
]

router.get('/', all, useView(`${templateBase}/list`))
router.get('/create', createNew, useView(`${templateBase}/details`))
router.post('/create', validator, create, redirectAfterPost)
router.get('/:id', get, useView(`${templateBase}/summary`))
router.get('/:id/details', get, useView(`${templateBase}/details`))
router.get('/:id/change-status', get, useView(`${templateBase}/status-confirm`))
router.post('/:id/change-status', get, updateStatus, redirectAfterPost)
router.post('/:id/details', get, validator, update, redirectAfterPost)
router.get('/:id/smart-item', get, allSmartItems, useView(`${templateBase}/smart-item`))
router.get('/:id/add-smart-item/:smartItemId', addSmartItem, redirectAfterPost)
router.get('/:id/del-smart-item/:smartItemId', delSmartItem, redirectAfterPost)

export default router
