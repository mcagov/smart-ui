import moment from 'moment'
import { validationResult } from 'express-validator'
import { logger } from '@mca/common-logger'
import TraineeRetention from '../services/trainee-retention.mjs'
import OktaUsers from '../services/okta.users.js'
import LocalUsers from '../services/local.users.js'
import { getAccessToken, govUKErrors, safeReturnUrl, useLocalAuth } from '../utils.js'
import { getQueryParams, handleApiError, handleLookupError, setPageMeta } from './lookups/common.js'
import { handleRedirect } from './common.js'

const service = new TraineeRetention()
const users = useLocalAuth() ? new LocalUsers() : new OktaUsers()

const BASE_URL = '/trainee-retention-review'
const REVIEW_STATUSES = ['NeedsReview', 'Reviewed', 'Retained', 'All']
const DEFAULT_REVIEW_STATUS = 'NeedsReview'
const FILTER_KEYS = ['trainingProviderId', 'searchText', 'dueAtNextRun']
const SUCCESS_KEY = 'retentionReviewSuccess'

export async function list (req, res, next) {
  try {
    if (!REVIEW_STATUSES.includes(req.query.reviewStatus)) {
      req.query.reviewStatus = DEFAULT_REVIEW_STATUS
    }

    const defaultSort = req.query.reviewStatus === 'Retained' ? 'extendedUntil' : 'lastActiveDate'
    const params = getQueryParams(req, ['trainingProviderId'], defaultSort)
    if (req.query.reviewStatus !== 'All') {
      params.reviewStatus = req.query.reviewStatus
    }
    if (req.query.searchText) {
      params.searchText = req.query.searchText.trim()
    }
    if (req.query.dueAtNextRun === 'true') {
      params.dueAtNextRun = true
    }

    const accessToken = getAccessToken(req)
    const [candidates, summary] = await Promise.all([
      service.candidates(accessToken, params),
      service.summary(accessToken)
    ])

    if (['Reviewed', 'Retained'].includes(req.query.reviewStatus)) {
      const nameOf = await getUserNames(candidates.data.flatMap((c) => [c.reviewedBy, c.retainedBy, c.extendedBy]))
      candidates.data.forEach((c) => {
        c.reviewedByName = nameOf(c.reviewedBy)
        c.retainedByName = nameOf(c.retainedBy)
        c.extendedByName = nameOf(c.extendedBy)
      })
    }

    setPageMeta(req, candidates, ['reviewStatus', ...FILTER_KEYS])
    res.locals.candidates = candidates
    res.locals.summary = summary
    res.locals.dueNotReviewed = summary.needsReviewDueAtNextRun
    res.locals.reviewStatus = req.query.reviewStatus
    res.locals.returnUrl = req.originalUrl
    const filters = {}
    FILTER_KEYS.forEach((k) => { if (candidates.meta.queries[k]) filters[k] = candidates.meta.queries[k] })
    res.locals.filterQuery = new URLSearchParams(filters).toString()
    res.locals.successMessage = req.session[SUCCESS_KEY]
    delete req.session[SUCCESS_KEY]
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

async function getUserNames (logins) {
  const names = new Map()
  const unique = [...new Set(logins.filter(Boolean))]
  if (unique.length > 0) {
    try {
      const found = await users.getAllByLogin(unique)
      found.forEach((u) => {
        names.set((u.profile.login || u.profile.email).toLowerCase(), `${u.profile.firstName} ${u.profile.lastName}`)
      })
    } catch (err) {
      logger.error('Failed to look up user names, showing logins instead', err)
    }
  }
  return (login) => names.get(login?.toLowerCase())
}

export function setReturnUrl (req, res, next) {
  res.locals.returnUrl = safeReturnUrl(req.query.return, BASE_URL)
  next()
}

export function getOverride (required = false) {
  return async function (req, res, next) {
    try {
      const override = await service.get(getAccessToken(req), req.params.traineeId)
      const nameOf = await getUserNames([override.createdBy, override.updatedBy])
      override.createdByName = nameOf(override.createdBy)
      override.updatedByName = nameOf(override.updatedBy)
      res.locals.override = override
      next()
    } catch (err) {
      if (!required && err.status === 404) {
        next()
      } else {
        handleLookupError(err, next)
      }
    }
  }
}

export async function getReview (req, res, next) {
  try {
    const review = await service.getReview(getAccessToken(req), req.params.traineeId)
    const nameOf = await getUserNames([review.reviewedBy])
    review.reviewedByName = nameOf(review.reviewedBy)
    res.locals.review = review
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export async function getNextRunDate (req, res, next) {
  try {
    const summary = await service.summary(getAccessToken(req))
    res.locals.nextRunDate = summary.nextRunDate
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

export function setRetainDefaults (req, res, next) {
  const override = res.locals.override
  const from = override ? moment.max(moment(), moment(override.extendedUntil)) : moment()
  res.locals.retention = {
    extendedUntil: from.add(1, 'year').format('YYYY-MM-DD'),
    reason: override?.reason
  }
  next()
}

export function readRetainUntil (body) {
  const [day, month, year] = ['day', 'month', 'year'].map((part) => `${body[`extendedUntil-${part}`] ?? ''}`.trim())
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) {
    return undefined
  }
  const date = moment({ year: Number(year), month: Number(month) - 1, date: Number(day) })
  return date.isValid() ? date : undefined
}

function redirectWithSuccess (req, res, message) {
  req.session[SUCCESS_KEY] = message
  handleRedirect(res, req.query.return, BASE_URL)
}

function ukDate (date) {
  return moment(date).format('D MMMM YYYY')
}

function traineeLabel (trainee) {
  return trainee.contactName || trainee.matsuNumber || 'The trainee'
}

export async function retain (req, res, next) {
  const view = 'trainee-retention-review/retain'
  res.locals.retention = {
    traineeId: req.params.traineeId,
    extendedUntil: readRetainUntil(req.body)?.format('YYYY-MM-DD'),
    reason: req.body.reason?.trim()
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render(view, { errors: govUKErrors(errors.errors) })
    return
  }
  try {
    if (res.locals.override) {
      await service.put(getAccessToken(req), req.params.traineeId, res.locals.retention)
    } else {
      await service.create(getAccessToken(req), res.locals.retention)
    }
    redirectWithSuccess(req, res,
      `${traineeLabel(res.locals.trainee)} will be retained until ${ukDate(res.locals.retention.extendedUntil)}`)
  } catch (err) {
    handleApiError(req, res, next, err, view)
  }
}

export async function review (req, res, next) {
  const view = 'trainee-retention-review/review'
  res.locals.review = { traineeId: req.params.traineeId }
  if (req.body.note?.trim()) {
    res.locals.review.note = req.body.note.trim()
  }
  try {
    await service.createReview(getAccessToken(req), res.locals.review)
    redirectWithSuccess(req, res, `${traineeLabel(res.locals.trainee)} has been marked as reviewed`)
  } catch (err) {
    handleApiError(req, res, next, err, view)
  }
}

export async function removeRetention (req, res, next) {
  try {
    await service.del(getAccessToken(req), req.params.traineeId)
    redirectWithSuccess(req, res, `Retention removed for ${traineeLabel(res.locals.trainee)}`)
  } catch (err) {
    handleApiError(req, res, next, err, 'trainee-retention-review/remove-retention')
  }
}

export async function undoReview (req, res, next) {
  try {
    await service.deleteReview(getAccessToken(req), req.params.traineeId)
    redirectWithSuccess(req, res, `Review undone for ${traineeLabel(res.locals.trainee)}`)
  } catch (err) {
    handleApiError(req, res, next, err, 'trainee-retention-review/undo-review')
  }
}
