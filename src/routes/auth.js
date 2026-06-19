import express from 'express'
import { check } from 'express-validator'
import {
  activationTokenAuth,
  changePassword,
  forgotPassword,
  getView,
  login, requiresUser, resendActivation,
  password, resetTokenAuth,
  userWelcome, loginWithAD
} from '../controllers/auth.js'

const router = new express.Router({ mergeParams: true })

// https://auth0.com/blog/express-validator-tutorial/
// https://express-validator.github.io/docs/custom-error-messages.html

const emailMsg = 'Enter an email address in the correct format, like name@example.com'
const passLoginMsg = 'Your password must have more than 8 characters'
const passRegisterMsg = 'Your password must be at least 8 characters with an uppercase, lowercase and a number'
const oldPassMsg = 'Enter your existing password'

const loginValidation = [
  check('email', emailMsg).not().isEmpty().isEmail().isLength({ max: 320 }),
  check('password', passLoginMsg).not().isEmpty().isLength({ min: 8, max: 72 })
]

const resetValidation = [
  check('email', emailMsg).not().isEmpty().isEmail().trim().escape()
]

const resetPasswordValidation = [
  check('password', passRegisterMsg).not().isEmpty().isLength({ min: 8, max: 72 }),
  check('password2', 'The passwords must match').custom((value, { req }) => (value === req.body.password))
]

const changePasswordValidation = [
  check('oldPassword', oldPassMsg).not().isEmpty().isLength({ min: 8, max: 72 }),
  check('newPassword', passRegisterMsg).not().isEmpty().isLength({ min: 8, max: 72 }),
  check('newPassword2', 'The passwords must match').custom((value, { req }) => (value === req.body.newPassword))
]

router.get('/signin', getView('users/login'))
router.post('/signin', loginValidation, login)

router.get('/signin/reset-password/:token', resetTokenAuth)
router.get('/signin/reset-password', getView('users/reset-password'))
router.post('/signin/reset-password', resetPasswordValidation, password('reset-password'))

router.get('/signin/azure-ad', loginWithAD)

router.get('/forgot-password', getView('users/forgot-password'))
router.post('/forgot-password', resetValidation, forgotPassword)

router.get('/change-password', requiresUser, getView('users/change-password'))
router.post('/change-password', requiresUser, changePasswordValidation, changePassword)

router.get('/welcome/:token', activationTokenAuth)
router.get('/user/welcome', userWelcome)
router.post('/user/welcome', resetPasswordValidation, password('welcome'))

router.get('/resend-activation', getView('users/resend-activation'))
router.post('/resend-activation', resetValidation, resendActivation)

router.get('/my-details', requiresUser, getView('users/my-details'))

export default router
