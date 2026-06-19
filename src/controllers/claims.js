import { logger } from '@mca/common-logger'
import Claims from '../services/claims.js'
import TraineeBalancingClaims from '../services/trainee-balancing-claim.js'
import OtherClaims from '../services/other-claim.js'

import {
  defaultPageLimits,
  handleLookupError,
  getQueryParams,
  setPageMeta
} from './lookups/common.js'
import {
  capitalize,
  getAccessToken,
  govApiErrorMsg,
  govUKErrors,
  isTrue
} from '../utils.js'
import assert from 'assert'
import { validationResult } from 'express-validator'

const service = new Claims()
const serviceTBC = new TraineeBalancingClaims()
const serviceOC = new OtherClaims()

export async function create(req, res) {
  const redirect = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}`
  try {
    await service.create(
      getAccessToken(req),
      req.params.id,
      req.params.year,
      req.params.period
    )
    res.redirect(redirect)
  } catch (err) {
    res.status(400).render('claims/period', {
      errors: govUKErrors([{ msg: govApiErrorMsg(err) }])
    })
  }
}

export async function updateStatus(req, res) {
  const redirect = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}`
  try {
    await service.updateStatus(
      getAccessToken(req),
      req.params.id,
      req.params.year,
      req.params.period,
      res.locals.statusAction
    )
    res.redirect(redirect)
  } catch (err) {
    logger.error('updateStatus: error ', err)
    res.status(400).render('status/confirm', {
      errors: govUKErrors([{ msg: govApiErrorMsg(err) }])
    })
  }
}

export function search(failSilent = false) {
  return async function (req, res, next) {
    try {
      const queryKeys = ['status', 'financialYear', 'financialPeriod']
      const params = getQueryParams(req, queryKeys, 'financialYear')
      res.locals.claimPeriods = await service.all(getAccessToken(req), params)
      setPageMeta(req, res.locals.claimPeriods, queryKeys)
      next()
    } catch (err) {
      logger.error('search: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getFinancialYear(failSilent = false) {
  return async function (req, res, next) {
    try {
      defaultPageLimits(req)
      res.locals.financialYear = {
        data: await service.getFinancialYear(
          getAccessToken(req),
          req.params.id,
          req.params.year
        )
      }
      res.locals.financialYear.meta = { year: req.params.year }
      next()
    } catch (err) {
      logger.error('getFinancialYear: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getPeriod(failSilent = false) {
  return async function (req, res, next) {
    try {
      res.locals.claimPeriod = await service.getClaimPeriodByTpId(
        getAccessToken(req),
        req.params.id,
        req.params.year,
        req.params.period
      )
      next()
    } catch (err) {
      logger.error('getPeriod: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

// TODO split
export function getPeriodItems(failSilent = false) {
  return async function (req, res, next) {
    try {
      const queryKeys = ['searchText']
      const params = getQueryParams(req, queryKeys, '', 20)
      if (req.params.viewType === 'balancing-claims') {
        res.locals.viewType = 'balancing-claims'
        res.locals.claimBalancingItems =
          await service.getClaimPeriodBalancingItems(
            getAccessToken(req),
            req.params.id,
            req.params.year,
            req.params.period,
            params
          )
        setPageMeta(req, res.locals.claimBalancingItems)
        res.locals.claimBalancingItems.meta.year = req.params.year
        res.locals.claimBalancingItems.meta.period = req.params.period
      } else if (req.params.viewType === 'other-claims') {
        res.locals.viewType = 'other-claims'
        res.locals.claimOtherItems = await service.getClaimPeriodOtherItems(
          getAccessToken(req),
          req.params.id,
          req.params.year,
          req.params.period,
          params
        )
        setPageMeta(req, res.locals.claimOtherItems)
        res.locals.claimOtherItems.meta.year = req.params.year
        res.locals.claimOtherItems.meta.period = req.params.period
      } else if (req.params.viewType === 'si-summary') {
        res.locals.viewType = 'si-summary'
        res.locals.claimSiSummaryItems = await service.getClaimSiSummaryItems(
          getAccessToken(req),
          req.params.id,
          req.params.year,
          req.params.period,
          params
        )
      } else {
        res.locals.viewType = 'trainee-claims'
        res.locals.claimItems = await service.getClaimPeriodItems(
          getAccessToken(req),
          req.params.id,
          req.params.year,
          req.params.period,
          params
        )
        setPageMeta(req, res.locals.claimItems, queryKeys)
        res.locals.claimItems.meta.year = req.params.year
        res.locals.claimItems.meta.period = req.params.period
      }
      next()
    } catch (err) {
      logger.error('getPeriodItems: error ', err)
      res.locals.claimItems = {}
      setPageMeta(req, res.locals.claimItems)
      res.locals.claimItems.meta.year = req.params.year
      res.locals.claimItems.meta.period = req.params.period
      handleLookupError(err, next, failSilent)
    }
  }
}

export function commentContext(req, res, next) {
  res.locals.resourceUrl = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}`
  res.locals.resourceName = 'claim'
  res.locals.resourceSubject = `Claim ${req.params.year}/${req.params.period}`
  next()
}

const statusMap = {
  submitted: 'submit',
  reviewing: 'start reviewing',
  reviewed: 'finish reviewing',
  rejected: 'reject',
  pending: 'un-submit',
  approved: 'approve'
}

export function setStatusContext(req, res, next) {
  const status = req.params.status
  res.locals.trainingProviderId = req.params.id
  res.locals.entityName = 'claim'
  res.locals.year = req.params.year
  res.locals.period = req.params.period
  res.locals.statusText = statusMap[status]
  res.locals.statusAction = capitalize(status)
  next()
}

export function getTraineesWithClaims(failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.id, 'req.params.id is not set')
      res.locals.bcTrainees = await service.getTraineesWithClaims(
        getAccessToken(req),
        req.params.id
      )
      next()
    } catch (err) {
      logger.error('getTraineesWithClaims: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getBcTraineesDropDown(failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.id, 'req.params.id is not set')
      res.locals.bcTrainees = await service.getBcTraineesDropDown(
        getAccessToken(req),
        req.params.id
      )
      next()
    } catch (err) {
      logger.error('getBcTraineesDropDown: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getBcTrainingDropDown(failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.id, 'req.params.id is not set')
      res.locals.bcTrainings = await service.getBcTrainingDropDown(
        getAccessToken(req),
        req.params.id
      )
      next()
    } catch (err) {
      logger.error('getBcTrainingDropDown: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getTraineeClaims(failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.id, 'req.params.id is not set')
      assert.ok(req.params.traineeId, 'req.params.traineeId is not set')
      res.locals.bcTraineeClaims = await service.getTraineeClaims(
        getAccessToken(req),
        req.params.id,
        req.params.traineeId
      )
      next()
    } catch (err) {
      logger.error('getTragetTraineeClaimsineesWithClaims: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

export async function createBalancingClaim(req, res) {
  const redirect = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}/balancing-claims`
  const view = req.originalUrl.includes('no-claim')
    ? 'claims/bc-trainee-no-claims'
    : 'claims/bc-trainee-claims'
  try {
    // get the claim
    const claim = await service.getClaimPeriodByTpId(
      getAccessToken(req),
      req.params.id,
      req.params.year,
      req.params.period
    )

    const balancingClaim = {
      trainingProviderId: req.params.id,
      claimId: claim.id,
      traineeId: req.params.traineeId,
      smartItemId: req.body.bcTraineeClaim,
      amount: req.body.bcAmount,
      comment: req.body.bcComment,
      weeksClaimed: req.body.bcWeeksClaimed
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render(view, {
        errors: govUKErrors(errors.errors),
        balancingClaim
      })
    } else {
      await serviceTBC.create(getAccessToken(req), balancingClaim)
      res.redirect(redirect)
    }
  } catch (err) {
    logger.error('createBalancingClaim: error ', err)
    res.status(400).render('claims/bc-trainee-claims', {
      errors: govUKErrors([{ msg: govApiErrorMsg(err) }])
    })
  }
}

export async function updateBalancingClaim(req, res) {
  const redirect = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}/balancing-claims`
  try {
    // get the claim
    const claim = await service.getClaimPeriodByTpId(
      getAccessToken(req),
      req.params.id,
      req.params.year,
      req.params.period
    )

    const balancingClaim = {
      trainingProviderId: req.params.id,
      claimId: claim.id,
      traineeId: req.params.traineeId,
      smartItemId: req.body.bcTraineeClaim,
      amount: req.body.bcAmount,
      comment: req.body.bcComment,
      weeksClaimed: req.body.bcWeeksClaimed
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render('claims/bc-trainee-claims', {
        errors: govUKErrors(errors.errors),
        balancingClaim
      })
    } else {
      await serviceTBC.put(
        getAccessToken(req),
        req.params.balancingClaimId,
        balancingClaim
      )
      res.redirect(redirect)
    }
  } catch (err) {
    logger.error('updateBalancingClaim: error ', err)
    res.status(400).render('claims/bc-trainee-claims', {
      errors: govUKErrors([{ msg: govApiErrorMsg(err) }])
    })
  }
}

export async function deleteBalancingClaim(req, res) {
  const redirect = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}/balancing-claims`
  try {
    await serviceTBC.del(getAccessToken(req), req.params.balancingClaimId)
    res.redirect(redirect)
  } catch (err) {
    logger.error('deleteBalancingClaim: error ', err)
    res.status(400).render('claims/bc-delete-confirm', {
      errors: govUKErrors([{ msg: err.message }])
    })
  }
}

export function getBalancingClaim(failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(
        req.params.balancingClaimId,
        'req.params.balancingClaimId is not set'
      )
      res.locals.balancingClaim = await serviceTBC.get(
        getAccessToken(req),
        req.params.balancingClaimId
      )
      next()
    } catch (err) {
      logger.error('getBalancingClaim: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

export function forwardTraineeClaims(req, res, next) {
  // see does the trainee have any claims
  if (req.body.bcTrainee && req.body.bcTrainee.includes('---')) {
    const hasClaim = req.body.bcTrainee.split('---')[1]
    const trainee = req.body.bcTrainee.split('---')[0]
    if (isTrue(hasClaim)) {
      res.redirect(req.originalUrl + '/' + trainee)
    } else {
      res.redirect(req.originalUrl + '-no-claim/' + trainee)
    }
  } else {
    res.redirect(req.originalUrl + '/' + req.body.bcTrainee)
  }
}

export async function createOtherClaim(req, res) {
  const redirect = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}/other-claims`
  try {
    // get the claim
    const claim = await service.getClaimPeriodByTpId(
      getAccessToken(req),
      req.params.id,
      req.params.year,
      req.params.period
    )
    const otherClaim = {
      trainingProviderId: req.params.id,
      claimId: claim.id,
      paymentAmount: req.body.ocPaymentAmount,
      comment: req.body.ocComment
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render('claims/oc-add', {
        errors: govUKErrors(errors.errors),
        otherClaim
      })
    } else {
      await serviceOC.create(getAccessToken(req), otherClaim)
      res.redirect(redirect)
    }
  } catch (err) {
    logger.error('createOtherClaim: error ', err)
    res.status(400).render('claims/oc-add', {
      errors: govUKErrors([{ msg: err.message }])
    })
  }
}

export function getOtherClaim(failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.otherClaimId, 'req.params.otherClaimId is not set')
      res.locals.otherClaim = await serviceOC.get(
        getAccessToken(req),
        req.params.otherClaimId
      )
      next()
    } catch (err) {
      logger.error('getOtherClaim: error ', err)
      handleLookupError(err, next, failSilent)
    }
  }
}

export async function updateOtherClaim(req, res) {
  const redirect = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}/other-claims`
  try {
    assert.ok(req.params.otherClaimId, 'req.params.otherClaimId is not set')

    const otherClaim = {
      paymentAmount: req.body.ocPaymentAmount,
      comment: req.body.ocComment
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).render('claims/oc-add', {
        errors: govUKErrors(errors.errors),
        otherClaim
      })
    } else {
      await serviceOC.put(
        getAccessToken(req),
        req.params.otherClaimId,
        otherClaim
      )
      res.redirect(redirect)
    }
  } catch (err) {
    logger.error('updateOtherClaim: error ', err)
    res
      .status(400)
      .render('claims/oc-add', { errors: govUKErrors([{ msg: err.message }]) })
  }
}

export async function deleteOtherClaim(req, res) {
  const redirect = `/training-providers/${req.params.id}/claims/years/${req.params.year}/periods/${req.params.period}/other-claims`
  try {
    assert.ok(req.params.otherClaimId, 'req.params.otherClaimId is not set')
    await serviceOC.del(getAccessToken(req), req.params.otherClaimId)
    res.redirect(redirect)
  } catch (err) {
    logger.error('deleteBalancingClaim: error ', err)
    res.status(400).render('claims/bc-delete-confirm', {
      errors: govUKErrors([{ msg: err.message }])
    })
  }
}
