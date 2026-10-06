import moment from 'moment'
import { validationResult } from 'express-validator'
import { logger } from '@mca/common-logger'
import TraineeRetention from '../services/trainee-retention.mjs'
import OktaUsers from '../services/okta.users.js'
import LocalUsers from '../services/local.users.js'
import { getAccessToken, govUKErrors, safeReturnUrl, useLocalAuth } from '../utils.js'
import { createDate } from './common.js'
import { getQueryParams, handleApiError, handleLookupError, setPageMeta } from './lookups/common.js'

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

    const params = getQueryParams(req, ['trainingProviderId'], 'lastActiveDate')
    if (req.query.reviewStatus !== 'All') {
      params.reviewStatus = req.query.reviewStatus
    }
    if (req.query.searchText) {
      // Setting manually as the key is different
      params.contactName = req.query.searchText.trim()
    }
    if (req.query.dueAtNextRun === 'true') {
      params.dueAtNextRun = true
    }

    const accessToken = getAccessToken(req)
    const [candidates, summary, dueNotReviewed] = await Promise.all([
      service.candidates(accessToken, params),
      service.summary(accessToken),
      // Only the count is needed, across all candidates whatever the filters
      service.candidates(accessToken, { reviewStatus: 'NeedsReview', dueAtNextRun: true, page: 1, limit: 1 })
    ])

    // Only the reviewed tab shows who reviewed them
    if (req.query.reviewStatus === 'Reviewed') {
      const names = await getUserNames(candidates.data.map((c) => c.reviewedBy))
      candidates.data.forEach((c) => { c.reviewedByName = names.get(c.reviewedBy?.toLowerCase()) })
    }

    setPageMeta(req, candidates, ['reviewStatus', ...FILTER_KEYS])
    res.locals.candidates = candidates
    res.locals.summary = summary
    res.locals.dueNotReviewed = dueNotReviewed.meta.totalItems
    res.locals.reviewStatus = req.query.reviewStatus
    res.locals.returnUrl = req.originalUrl
    // Filters carried across the tabs, which reset the page
    const filters = {}
    FILTER_KEYS.forEach((k) => { if (candidates.meta.queries[k]) filters[k] = candidates.meta.queries[k] })
    res.locals.filterQuery = new URLSearchParams(filters).toString()
    // Shown once, after an action redirects back to the list
    res.locals.successMessage = req.session[SUCCESS_KEY]
    delete req.session[SUCCESS_KEY]
    next()
  } catch (err) {
    handleLookupError(err, next)
  }
}

/**
 * Looks up the names of the users who made changes, which the API records by login.
 * A login that isn't found, or a failed lookup, has no name, so the page shows the login instead.
 * @returns {Promise<Map<string, string>>} lower case login to "First Last"
 */
async function getUserNames (logins) {
  const unique = [...new Set(logins.filter(Boolean))]
  if (unique.length === 0) {
    return new Map()
  }
  try {
    const found = await users.getAllByLogin(unique)
    return new Map(found.map((u) => [
      (u.profile.login || u.profile.email).toLowerCase(),
      `${u.profile.firstName} ${u.profile.lastName}`
    ]))
  } catch (err) {
    logger.error('Failed to look up user names, showing logins instead', err)
    return new Map()
  }
}

/**
 * Sets the action pages' return link, back to the list as the user left it
 */
export function setReturnUrl (req, res, next) {
  res.locals.returnUrl = safeReturnUrl(req.query.return, BASE_URL)
  next()
}

/**
 * Loads the trainee's retention override, if they have one
 * @param {boolean} required when false a trainee without an override is not an error
 */
export function getOverride (required = false) {
  return async function (req, res, next) {
    try {
      res.locals.override = await service.get(getAccessToken(req), req.params.traineeId)
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
    const names = await getUserNames([review.reviewedBy])
    review.reviewedByName = names.get(review.reviewedBy?.toLowerCase())
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

/**
 * Defaults the retain form to a year from now, or for an extension a year past the current override
 */
export function setRetainDefaults (req, res, next) {
  const override = res.locals.override
  const from = override ? moment.max(moment(), moment(override.extendedUntil)) : moment()
  res.locals.retention = {
    extendedUntil: from.add(1, 'year').format('YYYY-MM-DD'),
    reason: override?.reason
  }
  next()
}

function redirectWithSuccess (req, res, message) {
  req.session[SUCCESS_KEY] = message
  res.redirect(safeReturnUrl(req.query.return, BASE_URL))
}

function ukDate (date) {
  return moment(date).format('D MMMM YYYY')
}

export async function retain (req, res, next) {
  const view = 'trainee-retention-review/retain'
  res.locals.retention = {
    traineeId: req.params.traineeId,
    extendedUntil: createDate('extendedUntil', req.body),
    reason: req.body.reason?.trim()
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render(view, { errors: govUKErrors(errors.errors) })
    return
  }
  try {
    // The API rejects a second override for a trainee, so an existing one is updated instead
    if (res.locals.override) {
      await service.put(getAccessToken(req), req.params.traineeId, res.locals.retention)
    } else {
      await service.create(getAccessToken(req), res.locals.retention)
    }
    redirectWithSuccess(req, res,
      `${res.locals.trainee.contactName} will be retained until ${ukDate(res.locals.retention.extendedUntil)}`)
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
    redirectWithSuccess(req, res, `${res.locals.trainee.contactName} has been marked as reviewed`)
  } catch (err) {
    handleApiError(req, res, next, err, view)
  }
}

export async function removeRetention (req, res, next) {
  try {
    await service.del(getAccessToken(req), req.params.traineeId)
    redirectWithSuccess(req, res, `Retention removed for ${res.locals.trainee.contactName}`)
  } catch (err) {
    handleApiError(req, res, next, err, 'trainee-retention-review/remove-retention')
  }
}

export async function undoReview (req, res, next) {
  try {
    await service.deleteReview(getAccessToken(req), req.params.traineeId)
    redirectWithSuccess(req, res, `Review undone for ${res.locals.trainee.contactName}`)
  } catch (err) {
    handleApiError(req, res, next, err, 'trainee-retention-review/undo-review')
  }
}
