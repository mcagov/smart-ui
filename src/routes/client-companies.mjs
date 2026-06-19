import express from 'express'
import { all, create, get, update } from '../controllers/client-companies.mjs'
import { redirectAfterPost, useView } from '../controllers/common.js'

const router = new express.Router()
const templateBase = 'client-companies'

router.get('/', all, useView(`${templateBase}/list`))
router.get('/create', useView(`${templateBase}/details`))
router.post('/create', create, redirectAfterPost)
router.get('/:id', get, useView(`${templateBase}/summary`))
router.get('/:id/details', get, useView(`${templateBase}/details`))
router.post('/:id/details', update, redirectAfterPost)

export default router
