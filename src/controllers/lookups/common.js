import { logger } from '@mca/common-logger'
import createError from 'http-errors'
import { isApiError } from '../common.js'

export function defaultPageLimits (req, limit = 10) {
  req.query.page ??= 1
  req.query.limit ??= limit
}

export function getPageParams (req, sort, limit = 10) {
  defaultPageLimits(req, limit)
  return {
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort ? req.query.sort : sort,
    order: req.query.order ? req.query.order : 'asc'
  }
}

export function getQueryParams (req, validKeys, sort, limit = 10) {
  defaultPageLimits(req, limit)
  const params = getPageParams(req, sort, limit)
  setQueries(params, req.query, validKeys)
  return params
}

export function setPageMeta (req, data, validKeys) {
  if (data) {
    if (!data.meta) { data.meta = {} }
    data.meta.page = req.query.page
    data.meta.limit = req.query.limit
    data.meta.sort = req.query.sort
    data.meta.order = req.query.order
    if (validKeys && Array.isArray(validKeys)) {
      data.meta.queries = {}
      setQueries(data.meta.queries, req.query, validKeys)
    }
  }
}

/**
 * Creates a new query object and only include valid keys from the source
 * @param {*} source
 * @param {*} validKeys
 * @returns
 */
export function getQueries (source, validKeys) {
  const queries = Object.assign({}, source)
  setQueries(queries, source, validKeys)
  return queries
}

/**
 * Updates A query object and only include valid keys from the source
 * @param {*} target
 * @param {*} source
 * @param {*} validKeys
 */
export function setQueries (target, source, validKeys) {
  if (typeof source === 'object' && validKeys && Array.isArray(validKeys)) {
    validKeys.forEach((k) => {
      if (source[k]) {
        target[k] = source[k]
      }
    })
  }
}

export function setRoleAs (role) {
  return async (req, res, next) => {
    res.locals.user = { role }
    next()
  }
}

export function handleLookupError (err, next, failSilent = false) {
  if (failSilent) {
    logger.info(`error occurred, failSilent ${failSilent}`, err)
    next()
  } else {
    if (err && err.response && err.response.request) {
      const errorReq = err.response.request
      logger.error(`error occurred, failSilent ${failSilent}, req ${errorReq.method} ${errorReq.url},  error:`, err)
    } else {
      logger.error(`error occurred, failSilent ${failSilent}, error:`, err)
    }

    // TODO should it be a 400 or 500?
    const status = err.status ? err.status : 400
    if (err?.response?.body?.message) {
      next(createError(status, err.response.body.message))
    } else {
      next(createError(status, err.message))
    }
  }
}

export function handleApiError (req, res, next, err, page, payload) {
  if (isApiError(err) && (err.status === 400 || err.status === 401)) {
    logger.debug(`api error occurred on page ${page}, error: ${err.response.body.message}`)
    res.status(400).render(page, {
      errors: [{ text: err.response.body.message }],
      payload
    })
  } else {
    logger.error('error occurred, error:', err)
    next(err)
  }
}
