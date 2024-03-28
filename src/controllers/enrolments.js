import { validationResult } from 'express-validator'
import TrainingProviderTrainings from '../services/trainingprovidertrainings.js'
import Enrolments from '../services/enrolments.js'
import { createDate } from './common.js'
import {
  checkEndIsSameOrAfter,
  dateNotPassed,
  getAccessToken,
  govUKErrors,
  isDate,
  isLeaveStatus,
  isNotBlank,
  isReactivateStatus,
  isTransferring,
  isTrue,
  leaveStatus,
  reactivateStatus
} from '../utils.js'
import { logger } from '@mca/common-logger'
import { handleLookupError } from './lookups/common.js'

const training = new TrainingProviderTrainings()
const enrolments = new Enrolments()
const templateBase = 'enrolments'

export async function getTraining(req, res, next) {
  // Lookup available training one discipline and level are chosen
  const params = {
    trainingProviderId: req.params.id,
    disciplineIds: req.body.discipline,
    levelIds: req.body.level,
    status: 'Active'
  }

  try {
    if (req.body.discipline && req.body.level) {
      res.locals.training = await training.all(getAccessToken(req), params)
    }
    if (isTrue(req.body.includeCovid)) {
      const covidTraining = await training.allCovidByTrainingId(
        getAccessToken(req),
        req.params.id
      )
      res.locals.training.data.push(...covidTraining)
    }
    next()
  } catch (err) {
    logger.warn(
      `Problem matching available training for ${JSON.stringify(params)}`
    )
    next()
  }
}

export function getEnrolmentsTraining(failSilent = false) {
  return async function (req, res, next) {
    try {
      logger.info('getting trainings')
      const params = {
        trainingProviderId: req.params.id,
        status: 'Active'
      }
      res.locals.trainings = await enrolments.getTrainingDropdown(
        getAccessToken(req),
        params
      )
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export async function enrolTrainee(req, res, next) {
  res.locals.enrolment = {
    trainingProviderId: req.params.id,
    traineeId: req.params.traineeId,
    trainingId: req.body.training,
    disciplineId: req.body.discipline,
    levelId: req.body.level,
    qualificationId: req.body.qualification,
    isGraduateEngineer: req.body.graduate,
    isExperiencedSeafarer: req.body.experienced,
    isJobBeingOffered: req.body.job,
    startDate: createDate('start-date', req.body),
    expectedEndDate: createDate('end-date', req.body),
    status: 'Active'
  }

  const redirect = `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/enrolments`
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render(`${templateBase}/create`, {
      errors: govUKErrors(errors.errors),
      trainingProvider: res.locals.trainingProvider
    })
  } else {
    if (
      !checkEndIsSameOrAfter(
        res.locals.enrolment.startDate,
        res.locals.enrolment.expectedEndDate
      )
    ) {
      res.status(400).render(`${templateBase}/enrolment`, {
        errors: govUKErrors([
          { msg: 'The end date must not be before the start date' }
        ]),
        trainingProvider: res.locals.trainingProvider
      })
      return
    }

    if (req.body.discipline && req.body.level && req.body.training) {
      try {
        await enrolments.create(getAccessToken(req), res.locals.enrolment)
        res.redirect(redirect)
      } catch (err) {
        if (err.status === 400 || err.status === 401) {
          const message = err.response.body.message
          res.status(400).render(`${templateBase}/create`, {
            errors: govUKErrors([{ msg: message }])
          })
        } else {
          logger.error(err)
          next(err)
        }
      }
    } else {
      res.status(400).render(`${templateBase}/create`, { noTraining: true })
    }
  }
}

function getUpdateObject(req, res) {
  const updated = {
    trainingProviderId: req.params.id,
    traineeId: req.params.traineeId,
    trainingId: res.locals.enrolment.training.id,
    isGraduateEngineer: res.locals.enrolment.isGraduateEngineer,
    isExperiencedSeafarer: res.locals.enrolment.isExperiencedSeafarer,
    isJobBeingOffered: res.locals.enrolment.isJobBeingOffered,
    startDate: res.locals.enrolment.startDate,
    expectedEndDate: res.locals.enrolment.expectedEndDate,
    cocNumber: res.locals.enrolment.cocNumber,
    cocIssuedDate: res.locals.enrolment.cocIssuedDate,
    noeIssuedDate: res.locals.enrolment.noeIssuedDate,
    status: res.locals.enrolment.status
  }

  if (res.locals.enrolment.discipline) {
    updated.disciplineId = res.locals.enrolment.discipline.id
  }
  if (res.locals.enrolment.level) {
    updated.levelId = res.locals.enrolment.level.id
  }
  if (res.locals.enrolment.qualification) {
    updated.qualificationId = res.locals.enrolment.qualification.id
  }

  return updated
}

function setDateIfValid(obj, objName, req, reqName) {
  const date = createDate(reqName, req.body)
  if (isNotBlank(date)) {
    obj[objName] = date
  }
}

export async function updateEnrolment(req, res, next) {
  const updated = getUpdateObject(req, res)

  if (res.locals.enrolment.status === 'Completed') {
    // only end date, job, noe and coc can be updated
    updated.isJobBeingOffered = req.body.job
    updated.cocNumber = req.body['coc-number']
    updated.cocIssuedDate = createDate('coc-issued-date', req.body)
    updated.noeIssuedDate = createDate('noe-issued-date', req.body)
    setDateIfValid(updated, 'expectedEndDate', req, 'end-date')
  } else if (res.locals.enrolment.status === 'Active') {
    updated.isJobBeingOffered = req.body.job
    updated.cocNumber = req.body['coc-number']
    setDateIfValid(updated, 'cocIssuedDate', req, 'coc-issued-date')
    setDateIfValid(updated, 'noeIssuedDate', req, 'noe-issued-date')
    setDateIfValid(updated, 'expectedEndDate', req, 'end-date')
    updated.status = req.body.status || res.locals.enrolment.status
    if (res.locals.enrolment.canEdit) {
      setDateIfValid(updated, 'startDate', req, 'start-date')
    }
  } else if (isLeaveStatus(res.locals.enrolment.status)) {
    setDateIfValid(updated, 'expectedEndDate', req, 'end-date')
    updated.status = req.body.status || res.locals.enrolment.status
  } else {
    updated.status = req.body.status || res.locals.enrolment.status
  }

  if (res.locals.user.isSuperAdmin) {
    updated.status = req.body.status || res.locals.enrolment.status
  }

  // must supply the end date when changing status
  if (updated.status !== 'Active' && !isDate(updated.expectedEndDate)) {
    res.status(400).render(`${templateBase}/enrolment`, {
      errors: govUKErrors([{ msg: 'End date must be supplied' }]),
      trainingProvider: res.locals.trainingProvider
    })
    return
  }

  if (!checkEndIsSameOrAfter(updated.startDate, updated.expectedEndDate)) {
    res.status(400).render(`${templateBase}/enrolment`, {
      errors: govUKErrors([
        { msg: 'End date must not be before the start date' }
      ]),
      trainingProvider: res.locals.trainingProvider
    })
    return
  }

  const redirect = `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/enrolments`
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render(`${templateBase}/enrolment`, {
      errors: govUKErrors(errors.errors),
      trainingProvider: res.locals.trainingProvider
    })
  } else {
    // check has status change and if it has, check got confirmation
    if (
      updated.status !== res.locals.enrolment.status &&
      !isTrue(req.body['status-change-confirmation'])
    ) {
      res.status(200).render(`${templateBase}/status-change-confirm`, {
        updated: updated,
        trainingProvider: res.locals.trainingProvider
      })
      return
    }
    try {
      console.log(`updating enrolment with ${JSON.stringify(updated)}`)
      await enrolments.put(getAccessToken(req), req.params.enrolmentId, updated)
      res.redirect(redirect)
    } catch (err) {
      if (err.status === 400 || err.status === 401) {
        const message = err.response.body.message
        res.status(400).render(`${templateBase}/enrolment`, {
          errors: govUKErrors([{ msg: message }])
        })
      } else {
        logger.error(err)
        next(err)
      }
    }
  }
}

export async function changeLeaveStatus(req, res, next) {

  if (!isLeaveStatus(res.locals.enrolment.status)) {
    res.status(400).render(`${templateBase}/change-leave-status`, {
      errors: govUKErrors([
        {
          msg: `Can only change leave status if current status is one of ${leaveStatus.join(
            ','
          )} `
        }
      ]),
      trainingProvider: res.locals.trainingProvider
    })
    return
  }

  if (!isLeaveStatus(req.body.status)) {
    res.status(400).render(`${templateBase}/change-leave-status`, {
      errors: govUKErrors([
        {
          msg: `Can only change leave status to one of ${leaveStatus.join(
            ','
          )} `
        }
      ]),
      trainingProvider: res.locals.trainingProvider
    })
    return
  }
  try {
    await enrolments.updateStatus(
      getAccessToken(req),
      req.params.enrolmentId,
      req.body.status
    )
    const redirect = `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/enrolments`
    res.redirect(redirect)

  } catch (err) {
    if (err.status === 400 || err.status === 401) {
      const message = err.response.body.message
      res.status(400).render(`${templateBase}/enrolment`, {
        errors: govUKErrors([{ msg: message }])
      })
    } else {
      logger.error(err)
      next(err)
    }
  }
}

export async function adminUpdateEnrolment(req, res, next) {
  const updated = getUpdateObject(req, res)

  // need to set it with teh existing trainingProviderId - in cases its a transfer
  updated.trainingProviderId = res.locals.enrolment.training.trainingProviderId

  updated.cocNumber = req.body['coc-number']
  setDateIfValid(updated, 'cocIssuedDate', req, 'coc-issued-date')
  setDateIfValid(updated, 'noeIssuedDate', req, 'noe-issued-date')
  setDateIfValid(updated, 'expectedEndDate', req, 'end-date')
  setDateIfValid(updated, 'startDate', req, 'start-date')
  updated.status = req.body.status || res.locals.enrolment.status

  if (!checkEndIsSameOrAfter(updated.startDate, updated.expectedEndDate)) {
    res.status(400).render(`${templateBase}/admin-update`, {
      errors: govUKErrors([
        { msg: 'End date must not be before the start date' }
      ]),
      trainingProvider: res.locals.trainingProvider
    })
    return
  }

  const redirect = `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/enrolments?status=&filter-button=&allTps=true`
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render(`${templateBase}/admin-update`, {
      errors: govUKErrors(errors.errors),
      trainingProvider: res.locals.trainingProvider
    })
  } else {
    // check has status change and if it has, check got confirmation
    if (
      updated.status !== res.locals.enrolment.status &&
      !isTrue(req.body['status-change-confirmation'])
    ) {
      res.status(200).render(`${templateBase}/status-change-confirm`, {
        updated: updated,
        trainingProvider: res.locals.trainingProvider
      })
      return
    }
    try {
      await enrolments.adminUpdate(
        getAccessToken(req),
        req.params.enrolmentId,
        updated
      )
      res.redirect(redirect)
    } catch (err) {
      if (err.status === 400 || err.status === 401) {
        const message = err.response.body.message
        res.status(400).render(`${templateBase}/admin-update`, {
          errors: govUKErrors([{ msg: message }])
        })
      } else {
        logger.error(err)
        next(err)
      }
    }
  }
}

export async function deleteEnrolment(req, res, next) {
  try {
    const redirect = `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/enrolments`
    await enrolments.del(getAccessToken(req), req.params.enrolmentId)
    res.redirect(redirect)
  } catch (err) {
    if (err.status === 400 || err.status === 401) {
      const message = err.response.body.message
      res.status(400).render(`${templateBase}/delete`, {
        errors: govUKErrors([{ msg: message }])
      })
    } else {
      logger.error(err)
      next(err)
    }
  }
}

export async function reactivate(req, res, next) {
  if (!isReactivateStatus(res.locals.enrolment.status)) {
    res.status(400).render(`${templateBase}/reactivate-status`, {
      errors: govUKErrors([
        {
          msg: `Can only reactive enrolment if current status is one of ${reactivateStatus.join(
            ','
          )} `
        }
      ]),
      trainingProvider: res.locals.trainingProvider
    })
    return
  }

  try {
    await enrolments.reactivate(
      getAccessToken(req),
      req.params.enrolmentId
    )
    const redirect = `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/enrolments`
    res.redirect(redirect)
  } catch (err) {
    if (err.status === 400 || err.status === 401) {
      const message = err.response.body.message
      res.status(400).render(`${templateBase}/enrolment`, {
        errors: govUKErrors([{ msg: message }])
      })
    } else {
      logger.error(err)
      next(err)
    }
  }
}

export async function rejectTransfer(req, res, next) {
  if (!isTransferring(res.locals.enrolment.status)) {
    res.status(400).render(`${templateBase}/reject-transfer`, {
      errors: govUKErrors([
        {
          msg: `Can only reject transfer if current status is "Transferring".`
        }
      ]),
      trainingProvider: res.locals.trainingProvider
    })
    return
  }

  try {
    await enrolments.rejectTransfer(
      getAccessToken(req),
      req.params.enrolmentId
    )
    const redirect = `/training-providers/${req.params.id}/trainees/${req.params.traineeId}/enrolments`
    res.redirect(redirect)
  } catch (err) {
    if (err.status === 400 || err.status === 401) {
      const message = err.response.body.message
      res.status(400).render(`${templateBase}/enrolment`, {
        errors: govUKErrors([{ msg: message }])
      })
    } else {
      logger.error(err)
      next(err)
    }
  }
}
