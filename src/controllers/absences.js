import assert from 'assert'
import Absences from '../services/absences.js'
import { createDate, handleRedirect } from './common.js'
import { getQueryParams, setPageMeta, handleLookupError, handleApiError } from './lookups/common.js'
import { validationResult } from 'express-validator'
import { getAccessToken, govUKErrors } from '../utils.js'

const absences = new Absences()

function getPath (req) {
  return `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/absences`
}

function getAbsenceBody (req) {
  return {
    trainingProviderId: req.params.id,
    traineeId: req.params.traineeId,
    startDate: createDate('start-date', req.body),
    duration: parseFloat(req.body.duration)
  }
}

export function create (req, res, next) {
  const body = getAbsenceBody(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render('absences/details', {
      errors: govUKErrors(errors.errors),
      absence: body
    })
  } else {
    absences
      .create(getAccessToken(req), body)
      .then(_ => { handleRedirect(res, req.query.return, `${getPath(req)}`) })
      .catch(err => {
        handleApiError(req, res, next, err, 'absences/details', { absence: body })
      })
  }
}

export function update (req, res, next) {
  const body = getAbsenceBody(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render('absences/details', {
      errors: govUKErrors(errors.errors),
      absence: body
    })
  } else {
    absences
      .put(getAccessToken(req), req.params.absenceId, body)
      .then(_ => { handleRedirect(res, req.query.return, `${getPath(req)}`) })
      .catch(err => {
        handleApiError(req, res, next, err, 'absences/details', { absence: body })
      })
  }
}

export function getAbsence (failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.absenceId, 'req.params.absenceId is not set')
      res.locals.absence = await absences.get(getAccessToken(req), req.params.absenceId)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getAbsences (failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getQueryParams(req, [], 'startDate')
      params.trainingProviderId = req.params.id
      params.traineeId = req.params.traineeId
      res.locals.absences = await absences.all(getAccessToken(req), params)
      setPageMeta(req, res.locals.absences)
      res.locals.trainingProviderId = req.params.id
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}
