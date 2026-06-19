import express from 'express'
import { getTrainee, getTrainees, getDuplicates, getTransferring } from '../controllers/lookups/trainees.js'
import { useView } from '../controllers/common.js'

const router = new express.Router()

router.get('/', getTrainees(), useView('trainees/list'))
router.get('/duplicates', getDuplicates(), useView('trainees/duplicates-list'))
router.get('/transferring', getTransferring(), useView('trainees/transferring-list'))
router.get('/:traineeId', getTrainee(), useView('trainees/overview'))

export default router
