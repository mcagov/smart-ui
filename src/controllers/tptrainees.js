import moment from 'moment'
import { validationResult } from 'express-validator'
import Trainees from '../services/trainees.js'
import { createDate, handleRedirect } from './common.js'
import { getAccessToken, govUKErrors, isNotBlank } from '../utils.js'
import { handleLookupError } from './lookups/common.js'
import { logger } from '@mca/common-logger'
import createError from 'http-errors'

const trainees = new Trainees()
const templateBase = 'tptrainees'

function createTrainee(req, res, next) {
  res.locals.trainee = {}
  next()
}

export function removeClientCompany(failSilent = false) {
  return async function (req, res, next) {
    try {
      delete res.locals.trainee.clientCompanyId
      await updateTrainee(
        req,
        res,
        next,
        res.locals.trainee,
        'details',
        'address'
      )
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function updateTraineeDetails(failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.trainee.contactName = req.body['contact-name']
      res.locals.trainee.nationality = req.body.nationality
      res.locals.trainee.placeOfBirth = req.body['place-of-birth']
      res.locals.trainee.dateOfBirth = createDate('dob', req.body)
      res.locals.trainee.gender = req.body.gender
      await updateTrainee(
        req,
        res,
        next,
        res.locals.trainee,
        'details',
        'address'
      )
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function updateTraineeAddressDetails(failSilent = false) {
  return async function updateTraineeAddressDetails(req, res, next) {
    try {
      res.locals.trainee.addressLine1 = req.body['address-line-1']
      res.locals.trainee.addressLine2 = req.body['address-line-2']
      res.locals.trainee.townArea = req.body['address-town']
      res.locals.trainee.postcode = req.body['address-postcode']
      await updateTrainee(req, res, next, res.locals.trainee, 'address', '')
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

async function updateTrainee(req, res, next, data, page, nextPage) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    // checkForDobError(errors.errors)
    res.status(400).render(`${templateBase}/${page}`, {
      errors: govUKErrors(errors.errors),
      data
    })
  } else {
    try {
      data.trainingProviderId = req.params.id

      if (req.body.company && isNotBlank(req.body.company)) {
        data.clientCompanyId = req.body.company
      } else if (res.locals.trainee?.clientCompany?.id) {
        data.clientCompanyId = res.locals.trainee.clientCompany.id
      }

      if (req.params.traineeId) {
        await trainees.put(getAccessToken(req), req.params.traineeId, data)
      } else {
        const trainee = await trainees.create(getAccessToken(req), data)
        req.params.traineeId = trainee.id
      }
      handleRedirect(
        res,
        req.query.return,
        `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/${nextPage}`
      )
    } catch (err) {
      if (err.status === 400 || err.status === 401) {
        res.status(400).render(`${templateBase}/${page}`, {
          errors: matchErrorWithInput(err),
          trainingProvider: data
        })
      } else {
        handleLookupError(err, next, false)
      }
    }
  }
}

export function updateTraineeStatus(failSilent = false) {
  return async function updateTraineeStatus(req, res, next) {
    try {
      await trainees.updateStatus(
        getAccessToken(req),
        req.params.traineeId,
        res.locals.statusAction
      )
      handleRedirect(
        res,
        req.query.return,
        `/training-providers/${req.params.id}/trainees/${req.params.traineeId}`
      )
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

async function deleteTrainee(req, res, next) {
  if (res.locals.trainee.canDelete) {
    try {
      await trainees.del(getAccessToken(req), req.params.traineeId)
      handleRedirect(
        res,
        req.query.return,
        `/training-providers/${req.params.id}/trainees/`
      )
    } catch (err) {
      if (err.status === 400 || err.status === 401) {
        const message = err.response.body.message
        res.status(400).render(`status/confirm`, {
          errors: govUKErrors([{ msg: message }])
        })
      } else {
        logger.error(err)
        next(err)
      }
    }
  } else {
    // next(createError("400", "This trainee cannot be deleted."))
    res.status(400).render(`status/confirm`, {
      errors: govUKErrors([
        {
          msg: `The trainee ${res.locals.trainee.contactName} cannot be deleted`
        }
      ])
    })
  }
}

function matchErrorWithInput(error) {
  const message = error.response.body.message
  switch (message) {
    case 'Company number is not unique':
      return govUKErrors([{ msg: message, param: 'company-number' }])
    case 'Client company number is not unique':
      return govUKErrors([{ msg: message, param: 'client-company-number' }])
    default:
      return govUKErrors([{ msg: message }])
  }
}

// function checkForDobError (errors) {
//   // add a general dob error if any of the sub parts have errors
//   if (Array.isArray(errors) && errors.length > 0) {
//     const found = errors.find((e) => e.param && e.param.includes('dob-'))
//     if (found) {
//       errors.push({
//         value: '',
//         msg: 'Please enter a valid Date of Birth',
//         param: 'dateOfBirth',
//         location: 'body'
//       })
//     }
//   }
// }

function resourceContext(req, res, next) {
  res.locals.resourceUrl = `/training-providers/${req.params.id}/trainees/${req.params.traineeId}`
  if (res.locals.trainee.contactName) {
    res.locals.resourceSubject = `Trainee ${res.locals.trainee.contactName}`
  } else if (res.locals.trainee.matsuNumber) {
    res.locals.resourceSubject = `Trainee ${res.locals.trainee.matsuNumber}`
  } else {
    res.locals.resourceSubject = `Trainee ${res.locals.trainee.id}`
  }

  res.locals.resourceName = 'trainee'
  res.locals.attachmentTypes = [{ description: 'General', fileType: 'general' }]
  next()
}

export function statusContext(statusText, statusAction) {
  return async function (req, res, next) {
    res.locals.trainingProviderId = req.params.id
    res.locals.traineeId = req.params.traineeId
    res.locals.entityName = 'trainee'
    res.locals.statusText = statusText
    res.locals.statusAction = statusAction
    next()
  }
}

async function transfer(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render(`${templateBase}/transfer`, {
      errors: govUKErrors(errors.errors)
    })
  } else {
    try {
      await trainees.transfer(
        getAccessToken(req),
        req.params.traineeId,
        req.body.trainingProvider
      )
      res.redirect(
        `/training-providers/${req.body.trainingProvider}/trainees/${req.params.traineeId}`
      )
    } catch (err) {
      if (err.status === 400 || err.status === 401) {
        const message = err.response.body.message
        res.status(400).render(`${templateBase}/transfer`, {
          errors: govUKErrors([{ msg: message }])
        })
      } else {
        logger.error(err)
        next(err)
      }
    }
  }
}

export default {
  createTrainee,
  deleteTrainee,
  removeClientCompany,
  updateTraineeDetails,
  updateTraineeAddressDetails,
  updateTraineeStatus,
  transfer,
  resourceContext,
  statusContext
}
