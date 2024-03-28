import express from 'express'
import { useView } from '../controllers/common.js'
import { all, create, del, get, redirect, setContext, update } from '../controllers/attachments.js'

const router = new express.Router({ mergeParams: true })

const templateDir = 'attachments'
const validator = []

router.get('/', all(), setContext, useView(`${templateDir}/attachments`))
router.get('/upload', all(), useView(`${templateDir}/upload`))
router.post('/', validator, create)
router.use('/:attachmentId', get())
router.get('/:attachmentId', redirect)
router.post('/:attachmentId', update)
router.delete('/:attachmentId', del)

export default router
