import express from 'express'
import { check } from 'express-validator'
import { useView } from '../controllers/common.js'
import { setCommenters, getComments, getComment, create, reply, resolve } from '../controllers/comments.js'

const router = new express.Router({ mergeParams: true })

const templateDir = 'comments'
const validator = [
  check('message', 'Enter a comment').not().isEmpty().trim().escape()
]

router.get('/', getComments(), setCommenters, useView(`${templateDir}/list`))
router.post('/', validator, create)
router.use('/:commentId', getComment(), setCommenters)
router.get('/:commentId', useView(`${templateDir}/edit`))
// router.post('/:commentId', validator, update)
router.get('/:commentId/messages', getComment(), setCommenters, useView(`${templateDir}/messages`))
router.get('/:commentId/reply', useView(`${templateDir}/reply`))
router.post('/:commentId/reply', getComment(), setCommenters, validator, reply)
router.get('/:commentId/resolve', useView(`${templateDir}/resolve`))
router.post('/:commentId/resolve', resolve)

export default router
