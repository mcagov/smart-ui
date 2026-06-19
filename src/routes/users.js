import express from 'express'
import { useView } from '../controllers/common.js'
import {
  activate,
  adminResetPassword,
  deactivate,
  getUser,
  getUsers,
  registerUser,
  status,
  updateUser
} from '../controllers/users.js'
import { check } from 'express-validator'
import { isAb } from '../controllers/auth.js'

const router = new express.Router({ mergeParams: true })

const emailMsg = 'Enter an email address in the correct format, like name@example.com'

const registerValidation = [
  check('firstname', 'Enter your firstname').not().isEmpty().trim().isLength({ min: 1, max: 32 }),
  check('lastname', 'Enter your lastname').not().isEmpty().trim().isLength({ min: 1, max: 32 }),
  check('email', emailMsg).not().isEmpty().isEmail().trim().isLength({ max: 320 }),
  check('phone', 'Enter a UK telephone number').not().isEmpty().trim().isLength({ max: 15 })
]

router.get('/', getUsers, useView('users/users'))
router.get('/register', isAb, useView('users/register'))
router.post('/register', isAb, registerValidation, registerUser)

router.get('/:userId', getUser, useView('users/user'))
router.post('/:userId', isAb, getUser, updateUser, useView('users/edit'))
router.get('/:userId/edit', isAb, getUser, useView('users/edit'))
router.get('/:userId/deactivate', isAb, getUser, status('deactivate'), useView('users/confirm-status'))
router.post('/:userId/deactivate', isAb, getUser, deactivate, status('deactivate'))
router.get('/:userId/activate', isAb, getUser, status('activate'), useView('users/confirm-status'))
router.post('/:userId/activate', isAb, getUser, activate, status('activate'))
router.get('/:userId/admin-reset-password', isAb, getUser, useView('users/confirm-reset-password'))
router.post('/:userId/admin-reset-password', isAb, adminResetPassword, useView('users/confirm-reset-password'))

export default router
