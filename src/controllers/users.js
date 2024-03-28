import LocalUsers from '../services/local.users.js'
import OktaUsers, { getSignupError } from '../services/okta.users.js'
import { validationResult } from 'express-validator'
import { govUKErrors, useLocalAuth } from '../utils.js'
import { logger } from '@mca/common-logger'

let service = new OktaUsers()

if (useLocalAuth()) {
  logger.info('Using LocalUsers')
  service = new LocalUsers()
}

export async function getUsers (req, res, next) {
  res.locals.users = await service.getUsersByTrainingProviderId(req.params.id)
  next()
}

export async function getUser (req, res, next) {
  res.locals.users = await service.getUsersByTrainingProviderId(req.params.id)
  // rename so not to clash with logged in user
  res.locals.tpUser = await service.get(req.params.userId)
  next()
}

export function status (status) {
  return (req, res, next) => {
    res.locals.status = status
    next()
  }
}

export async function updateUser (req, res, next) {
  const updated = {
    firstName: req.body.firstname,
    lastName: req.body.lastname,
    primaryPhone: req.body.phone
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('users/edit', { error: govUKErrors(errors.errors) })
  } else {
    service
      .update(req.params.userId, updated)
      .then(() => { res.redirect(`/training-providers/${req.params.id}/users/${req.params.userId}`) })
      .catch((err) => {
        if (err.status === 500) {
          next(err)
        } else {
          res.render('users/edit', { error: getSignupError(err), profile: updated })
        }
      })
  }
}

export async function deactivate (req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('users/edit', { error: govUKErrors(errors.errors) })
  } else {
    service
      .deactivateOrDeleteUser(req.params.userId)
      .then(() => {
        if (res.locals.user.status === 'DEPROVISIONED') {
          res.redirect(`/training-providers/${req.params.id}/users`)
        } else {
          res.redirect(`/training-providers/${req.params.id}/users/${req.params.userId}`)
        }
      })
      .catch((err) => {
        if (err.status === 500) {
          next(err)
        } else {
          res.render('users/confirm-status', { error: getSignupError(err) })
        }
      })
  }
}

export async function activate (req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('users/edit', { error: govUKErrors(errors.errors) })
  } else {
    service
      .activate(req.params.userId)
      .then(() => { res.redirect(`/training-providers/${req.params.id}/users/${req.params.userId}`) })
      .catch((err) => {
        if (err.status === 500) {
          next(err)
        } else {
          res.render('users/confirm-status', { error: getSignupError(err) })
        }
      })
  }
}

export async function adminResetPassword (req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('users/edit', { error: govUKErrors(errors.errors) })
  } else {
    service
      .adminResetPassword(req.params.userId)
      .then(() => { res.redirect(`/training-providers/${req.params.id}/users/${req.params.userId}`) })
      .catch((err) => {
        if (err.status === 500) {
          next(err)
        } else {
          res.render('users/confirm-reset-password', { error: getSignupError(err) })
        }
      })
  }
}

export async function registerUser (req, res, next) {
  const user = {
    profile: {
      firstName: req.body.firstname,
      lastName: req.body.lastname,
      email: req.body.email,
      login: req.body.email,
      primaryPhone: req.body.phone,
      trainingProviderId: req.params.id
    }
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('users/register', { error: govUKErrors(errors.errors), profile: user.profile })
  } else {
    service
      .register(user)
      .then((created) => { res.redirect(`/training-providers/${req.params.id}/users/${created.id}`) })
      .catch((err) => {
        if (err.status === 500) {
          next(err)
        } else {
          res.render('users/register', { error: getSignupError(err), profile: user.profile })
        }
      })
  }
}
