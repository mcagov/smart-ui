import config from './config.js'
import { logger } from '@mca/common-logger'
import moment from 'moment'
import jwtDecode from 'jwt-decode'

export function govUKErrors(errs) {
  const errors = []
  errs.forEach((e) => {
    if (errors.findIndex((i) => i.href === `#${e.param}`) === -1) {
      errors.push({ text: e.msg, href: `#${e.param}` })
    }
  })
  return errors
}

export function govApiErrorMsg(err) {
  return err?.response?.body?.message ? err.response.body.message : err.message
}

export function sortName(a, b) {
  const nameA = a.profile.firstName.toUpperCase() // ignore upper and lowercase
  const nameB = b.profile.firstName.toUpperCase() // ignore upper and lowercase
  if (nameA < nameB) {
    return -1
  }
  if (nameA > nameB) {
    return 1
  }
  return 0
}

export function getUserRole(user) {
  if (user && user.groups) {
    return isInGroup(user.groups, '-administrative-body') ? 'admin' : 'tp'
  }
}

export function isInGroup(groups, group) {
  return groups.filter((g) => g.indexOf(group) > -1).length > 0
}

export function getEnv() {
  const env = (process.env.NODE_ENV || 'dev').toLowerCase()
  return env === 'local' ? 'dev' : env
}

export function useLocalAuth() {
  const env = (process.env.NODE_ENV || 'local').toLowerCase()
  return ['local', 'dev', 'test'].includes(env) && config.localAuth
}

export function logMsg(req, res, action, status) {
  const user = req.session.passport.user
  const application = res.locals.application
  const request = res.locals.request

  const log = {}
  if (action) {
    log.action = action
    log.message = action
  }
  if (status) {
    log.status = status
  }
  if (user) {
    log.userId = user.id
  }
  if (application) {
    log.applicationId = application.id
    log.entityType = 'application'
    log.register = application.register
  }
  if (request) {
    log.requestType = request.type
    log.requestStatus = request.status
    if (request.registration && request.registration.id) {
      log.registrationId = request.registration.id
    }
  }
  return log
}

export function logInfo(req, res, action) {
  logger.info(logMsg(req, res, action, 'SUCCESS'))
}

export function logError(req, res, action, err) {
  const log = logMsg(req, res, action, 'FAILED')
  log.error = { msg: err.message, status: err.status }
  logger.error(log)
}

export function logWarn(req, res, action, err) {
  const log = logMsg(req, res, action, 'FAILED')
  log.error = { msg: err.message, status: err.status }
  logger.warn(log)
}

export function getAccessToken(req) {
  return req?.session?.passport?.user?.tokens?.access_token
}

export function isBlank(str) {
  return (
    str === null ||
    !(typeof str === 'string') ||
    str.trim() === '' ||
    str.trim().length === 0
  )
}

export function isDate(str, format = 'YYYY-MM-DD') {
  return isNotBlank(str) && moment(str, format).isValid
}

export function isNotBlank(str) {
  return !isBlank(str)
}

export function contains(str, search) {
  return isNotBlank(str) && isNotBlank(search) && str.includes(search)
}

export function startsWith(str, search) {
  return isNotBlank(str) && isNotBlank(search) && str.startsWith(search)
}

export function capitalize(str) {
  if (isNotBlank(str)) {
    return str.replace(/^\w/, (c) => c.toUpperCase())
  } else {
    return ''
  }
}

export function dateNotPassed(str, fmt = 'YYYY-MM-DD') {
  return isDate(str, fmt) && moment(str, fmt).isSameOrAfter(moment(), 'day')
}

// sort the rates with current rate being the first item
export function sortRates(rates) {
  return rates.sort((a, b) => {
    const aStartDate = moment(a.startDate, 'YYYY-MM-DD')
    const bStartDate = moment(b.startDate, 'YYYY-MM-DD')
    if (aStartDate.isAfter(bStartDate)) return -1
    if (bStartDate.isAfter(aStartDate)) return 1
    return 0
  })
}

export function checkEndIsSameOrAfter(
  startDate,
  endDate,
  fmt = 'YYYY-MM-DD',
  defaultIfMissing = true
) {
  if (startDate && endDate) {
    const first = moment(startDate, fmt)
    const second = moment(endDate, fmt)
    return second.isSameOrAfter(first, 'day')
  } else {
    return defaultIfMissing
  }
}

export function getDurationInWeeks(
  startDate,
  endDate,
  fmt = 'YYYY-MM-DD',
  defaultIfMissing = 'TBC'
) {
  if (isDate(startDate, fmt) && isDate(endDate, fmt)) {
    const first = moment(startDate, fmt)
    const second = moment(endDate, fmt)
    if (first.isSame(second)) {
      // probably not a weekly course
      return 'N/A'
    }else{
      return ((second.diff(first, 'days') + 1) / 7.0)
    }
  } else {
    return defaultIfMissing
  }
}

export function getCurrentRate(rates) {
  if (Array.isArray(rates)) {
    let rate
    // rate  = rates.find(function (rate) {
    //   return rate.endDate == null;
    // });
    if (!rate) {
      logger.debug('rate not found')
      rate = sortRates(rates)[0]
    } else {
      logger.debug(`rate found ${JSON.stringify(rate, null, 2)}`)
    }

    return rate
  } else {
    // TODO should we throw an error?
    return {}
  }
}

export function getPeriod(date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  const month = date.getMonth() + 1
  return {
    year: `${month > 3 ? date.getFullYear() : date.getFullYear() - 1}`,
    period: `${month > 3 ? month - 3 : month + 9}`
  }
}

export function hasOwnProperty(item, property) {
  return Object.prototype.hasOwnProperty.call(item, property)
}

export function isTrue(str) {
  return typeof str !== 'undefined' && /^(true|0|yes|y|t)$/i.test(str)
}

export function isFalse(str) {
  return typeof str !== 'undefined' && !isTrue(str)
}

export function isSet(val) {
  return !(typeof val === 'undefined' || val === null)
}

export function isFalseOrNotSet(str) {
  return !isSet(str) || isFalse(str)
}

export function isHttps() {
  return !(process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'local')
}

export function daysAsMS(days) {
  return days * hoursAsMS(24)
}

export function hoursAsMS(hours) {
  return hours * 60 * 60 * 1000
}

export function getDomain() {
  // TODO extract this from the requestgro
  // https://ukshipregister.local.mcga.uk/
  switch (process.env.NODE_ENV || 'local') {
    case 'local':
      return 'localhost'
    case 'live':
      return '.mcga.gov.uk'
    default:
      return '.smart.mcga.uk'
  }
}

export function hasScope(req, scope) {
  const scopes = getScopes(req)
  if (scopes) {
    if (scopes.find((item) => item.startsWith(scope))) {
      return true
    } else {
      logger.debug(`hasScope: scope:${scope} not found in ${scopes}`)
    }
  }
  return false
}

export function hasRole(req, role) {
  return req.session?.passport?.user?.userinfo?.role === role
}

export function getScopes(req) {
  const accessToken = getAccessToken(req)
  if (accessToken) {
    const decoded = jwtDecode(accessToken)
    if (decoded) {
      const scopes = decoded?.scp
      if (scopes && Array.isArray(scopes) && scopes.length > 1) {
        return scopes
      } else {
        logger.debug(
          `getScopes: failed to get scopes in token: ${JSON.stringify(decoded)}`
        )
      }
    } else {
      logger.debug('getScopes: failed to decode token')
    }
  } else {
    logger.debug('getScopes: failed to get accessToken')
  }
}

export function notEmptyArray(arr) {
  return arr && Array.isArray(arr) && arr.length > 0
}

export function parseDate(field, body) {
  const year = body[`${field}-year`]
  const month = body[`${field}-month`]
  const day = body[`${field}-day`]
  return moment([year, month - 1, day])
}

export const leaveStatus = ['Left', 'LeaveOfAbsence', 'Deceased', 'Transferred']
export function isLeaveStatus(status) {
  return leaveStatus.includes(status)
}

export const reactivateStatus = ['Completed', ...leaveStatus]
export function isReactivateStatus(status) {
  return reactivateStatus.includes(status)
}

export function isTransferring(status) {
  return status === 'Transferring'
}

export function isSmart1(o) {
  // done for enrolment, but can be used for other things
  console.log(
    'isSmart1',
    o?.training?.trainingItem?.smartItems?.[0]?.smartCategory?.category
  )
  return (
    o?.training?.trainingItem?.smartItems?.[0]?.smartCategory?.category ===
    'SMarT 1'
  )
}
