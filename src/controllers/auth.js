import config from '../config.js'
import express from 'express'
import { randomUUID } from 'crypto'
import { validationResult } from 'express-validator'
import { getSessionUser } from '../services/auth.js'
import OktaUsers from '../services/okta.users.js'
import LocalUsers from '../services/local.users.js'
import { logger } from '@mca/common-logger'
import { govUKErrors, hasRole, hasScope, isInGroup, useLocalAuth } from '../utils.js'
import createError from 'http-errors'

let service = new OktaUsers()

if (useLocalAuth()) {
  logger.info('Using LocalUsers')
  service = new LocalUsers()
}

const defaultLoginError = [{
  text: 'Enter your email address that you signed up with',
  href: '#email'
}, {
  text: 'Enter a valid password',
  href: '#password'
}]

const defaultResetError = [{
  text: 'Enter your email address that you signed up with',
  href: '#email'
}]

const defaultPassMsg = 'Your password must be at least 8 characters with an uppercase, lowercase and a number'

export function login (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('users/login', {
      error: govUKErrors(errors.errors),
      username: req.body.email,
      password: req.body.password
    })
  } else {
    service
      .authn({ username: req.body.email, password: req.body.password })
      .then((data) => {
        if (data.status === 'PASSWORD_RESET' && data.recoveryType === 'ACCOUNT_ACTIVATION') {
          res.redirect('/user/welcome')
        } else if (data.status === 'PASSWORD_EXPIRED') {
          setUserSession(req, data)
          res.status(401).redirect('/change-password?expired=true')
        } else {
          req.session[`oidc:${process.env.OKTA_ISSUER_URL}`] = { state: randomUUID() }
          logger.info(`authn res ${JSON.stringify(data)}`)
          authorize(res, data.sessionToken)
        }
      })
      .catch((err) => {
        logger.error('login: error ', err)
        res.status(401).render('users/login', {
          error: defaultLoginError,
          username: req.body.email,
          password: req.body.password
        })
      })
  }
}

export function loginWithAD (req, res) {
  res.redirect(service.getADRedirectUrl())
}

export function forgotPassword (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('users/forgot-password', { error: govUKErrors(errors.errors), email: req.body.email })
  } else {
    service
      .forgotPassword({
        username: req.body.email,
        factorType: 'EMAIL'
      })
      .then(() => {
        res.render('users/forgot-password', { status: 'success', email: req.body.email })
      })
      .catch(() => {
        res.render('users/forgot-password', { error: defaultResetError })
      })
  }
}

export function password (mode) {
  return (req, res) => {
    const errors = validationResult(req)
    const token = getStateToken(req)
    if (!token) {
      res.status(401).render(`users/${mode}-error`)
    } else if (!errors.isEmpty()) {
      res.status(401).render('users/reset-password', {
        error: govUKErrors(errors.errors),
        password: req.body.password,
        password2: req.body.password2
      })
    } else {
      service
        .resetPassword({
          stateToken: getStateToken(req),
          newPassword: req.body.password
        })
        .then(() => {
          req.session[`oidc:${process.env.OKTA_ISSUER_URL}`] = {}
          res.redirect('/signin')
        })
        .catch((err) => {
          const error = [{
            text: getSafeError(err, defaultPassMsg),
            href: '#password'
          }]
          res.status(400).render('users/reset-password', {
            error,
            password: req.body.password,
            password2: req.body.password2
          })
        })
    }
  }
}

export function changePassword (req, res) {
  const errors = validationResult(req)
  const user = getSessionUser(req)
  const token = getStateToken(req)

  const data = {
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword,
    newPassword2: req.body.newPassword2
  }
  if (!user || !token) {
    res.status(401).redirect('/signin')
  } else if (!errors.isEmpty()) {
    res.status(401).render('users/change-password', {
      error: govUKErrors(errors.errors),
      data
    })
  } else {
    const credentials = {
      stateToken: token,
      oldPassword: req.body.oldPassword,
      newPassword: req.body.newPassword
    }
    service
      .changePassword(credentials)
      .then(() => {
        req.session[`oidc:${process.env.OKTA_ISSUER_URL}`] = {}
        res.redirect('/signin')
      })
      .catch((err) => {
        const error = getPasswordChangeError(err)
        res.status(400).render('users/change-password', {
          error, data
        })
      })
  }
}

export function resendActivation (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('users/resend-activation', { error: govUKErrors(errors.errors), email: req.body.email })
  } else {
    service
      .reactivate(req.body.email)
      .then(() => { res.render('users/resend-activation', { status: 'success', email: req.body.email }) })
      .catch(() => { res.render('users/resend-activation', { error: defaultResetError }) })
  }
}

export function resetTokenAuth (req, res) {
  const state = getStateToken(req)
  logger.debug('resetTokenAuth state = ' + state)
  logger.debug('resetTokenAuth token = ' + req.params.token)
  if (state) {
    res.redirect('/signin/reset-password')
  } else {
    service
      .resetPwAuthn({ recoveryToken: req.params.token })
      .then(data => {
        logger.debug('resetTokenAuth data.status = ' + data.status)
        logger.debug('resetTokenAuth data.recoveryType = ' + data.recoveryType)
        if ((data.status === 'PASSWORD_RESET' || data.status === 'RECOVERY') && (data.recoveryType === 'ACCOUNT_ACTIVATION' || data.recoveryType === 'PASSWORD')) {
          req.session[`oidc:${process.env.OKTA_ISSUER_URL}`] = { stateToken: data.stateToken }
          res.redirect('/signin/reset-password')
        } else {
          res.status(401).render('users/reset-password-error')
        }
      })
      .catch((err) => {
        logger.error('resetTokenAuth: error ', err)
        res.status(401).render('users/reset-password-error')
      })
  }
}

export function activationTokenAuth (req, res) {
  // https://support.okta.com/help/s/question/0D51Y00008cfUoaSAE/email-verification-rest-api?language=en_US
  const state = getStateToken(req)
  if (state) {
    res.redirect('/user/welcome')
  } else {
    service
      .authn({ token: req.params.token })
      .then(data => {
        if (data.status === 'PASSWORD_RESET' && data.recoveryType === 'ACCOUNT_ACTIVATION') {
          req.session[`oidc:${process.env.OKTA_ISSUER_URL}`] = { stateToken: data.stateToken }
          res.redirect('/user/welcome')
        } else {
          logger.error(`welcome-error: bad status "${data.status}" and recoveryType "${data.recoveryType}"`)
          res.status(401).render('users/welcome-error')
        }
      })
      .catch((err) => {
        logger.error(`welcome-error: activationTokenAuth: error ${err.msg}`, err)
        res.status(401).render('users/welcome-error')
      })
  }
}

export function userWelcome (req, res) {
  const token = getStateToken(req)
  if (!token) {
    res.redirect('/signin')
  } else {
    res.render('users/reset-password')
  }
}

export function getView (view) {
  return function (req, res) { res.render(view, { query: req.query }) }
}

export function requiresUser (req, res, next) {
  if (getSessionUser(req)) {
    next()
  } else {
    res.redirect('/signin')
  }
}

export function ensureAuthenticatedOkta (oidc) {
  const authRoute = express.Router()
  authRoute.use((request, response, next) => {
    logger.debug('before ensureAuthenticated ')
    next()
  })
  authRoute.use(oidc.ensureAuthenticated(oidc))
  authRoute.use(oidc.refreshTokenIfRequired)
  authRoute.use(checkScopes)
  authRoute.use((request, response, next) => {
    logger.debug('after ensureAuthenticated ')
    next()
  })

  return authRoute
}

export function isAb (req, res, next) {
  if (res.locals.user.isAdmin) {
    next()
  } else {
    next(createError(403, `User ${res.locals.user.id} is not an admin`))
  }
}

export function isSa (req, res, next) {
  if (res.locals.user.isSuperAdmin) {
    next()
  } else {
    next(createError(403, `User ${res.locals.user.id} is not a super admin`))
  }
}

export function isReportUser (req, res, next) {
  if (res.locals.user.isReportUser || res.locals.user.isAdmin || res.locals.user.isSuperAdmin) {
    next()
  } else {
    next(createError(403, `User ${res.locals.user.id} is not authorized for reports`))
  }
}

export function checkScopes (req, res, next) {
  // check if default scope is present
  if (!hasScope(req, config.defaultScope)) {
    logger.debug(`calling authorize to get scopes: ${JSON.stringify(res.locals.user)}`)
    const scopes = hasRole(req, 'admin') ? process.env.OKTA_SCOPE_AB : process.env.OKTA_SCOPE_TP
    const state = randomUUID()
    req.session[`oidc:${process.env.OKTA_ISSUER_URL}`] = { state }
    if (!req.originalUrl.includes('/callback')) {
      req.session.returnTo = req.originalUrl
    }
    res.redirect(process.env.OKTA_ISSUER_URL +
      '/v1/authorize' +
      '?client_id=' + process.env.OKTA_CLIENT_ID +
      '&response_type=code' +
      '&redirect_uri=' + process.env.OKTA_REDIRECT_URI +
      '&scope=' + scopes +
      '&state=' + state)
  } else {
    logger.debug('checkScopes: defaultScope found - not calling okta')
    next()
  }
}

function getStateToken (req) {
  if (req.session && req.session[`oidc:${process.env.OKTA_ISSUER_URL}`]) {
    return req.session[`oidc:${process.env.OKTA_ISSUER_URL}`].stateToken
  }
}

function authorize (res, sessionToken) {
  res.redirect(service.getRedirectUrl(sessionToken))
}

function getPasswordChangeError (err) {
  const summary = getErrorSummary(err)
  if (!summary) {
    return [{
      text: 'Enter your old password',
      href: '#oldPassword'
    }, {
      text: 'Enter a new password',
      href: '#newPassword'
    }]
  } else if (summary.includes('Old Password')) {
    return [{
      text: summary,
      href: '#oldPassword'
    }]
  } else {
    return [{
      text: summary,
      href: '#newPassword'
    }]
  }
}

function getSafeError (err, fallback) {
  if (err && err.response && err.response.body &&
    Array.isArray(err.response.body.errorCauses) &&
    err.response.body.errorCauses.length > 0) {
    return err.response.body.errorCauses[0].errorSummary
  } else {
    return fallback
  }
}

function getErrorSummary (err) {
  if (err && err.response && err.response.body &&
    Array.isArray(err.response.body.errorCauses) &&
    err.response.body.errorCauses.length > 0) {
    return err.response.body.errorCauses[0].errorSummary
  }
}

function setUserSession (req, user) {
  if (user && user && user._embedded && user._embedded.user) {
    req.session[`oidc:${process.env.OKTA_ISSUER_URL}`] = {
      stateToken: user.stateToken,
      user: user._embedded.user
    }
  }
}

export { getStateToken }
