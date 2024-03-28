import express from 'express'
import { get, all, update, create, createNew } from '../controllers/smart-categories.mjs'
import { redirectAfterPost, useView } from '../controllers/common.js'

const router = new express.Router()
const templateBase = 'smart-categories'

router.get('/', all, useView(`${templateBase}/list`))
router.get('/create', createNew, useView(`${templateBase}/details`))
router.post('/create', create, redirectAfterPost)
router.get('/:id', get, useView(`${templateBase}/summary`))
router.get('/:id/details', get, useView(`${templateBase}/details`))
router.post('/:id/details', update, redirectAfterPost)

export default router
