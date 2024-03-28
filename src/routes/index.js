import express from 'express'
import index from '../controllers/index.js'
import { useView } from '../controllers/common.js'
import path from 'path'
import * as url from 'url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const router = new express.Router()

router.get('/', index.index)
router.get('/contact-ab', useView('public/contact-ab'))
// router.get('/privacy-policy', useView('public/privacy-policy'))
router.get('/accessibility-statement', useView('public/accessibility-statement'))
router.get('/support', useView('public/support'))

router.get('/health', (req, res) => {
  res.status(200).send('Ok')
})

router.get('/build-info.json', function (req, res) {
  res.type('application/json')
  res.sendFile(path.join(__dirname, '../../public/build-info.json'))
})

export default router
