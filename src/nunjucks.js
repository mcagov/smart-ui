import path from 'path'
import * as url from 'url'
import nunjucks from 'nunjucks'
import moment from 'moment-timezone'
import { createRequire } from 'module'
import {
  getCurrentRate,
  isBlank,
  getPeriod,
  isFalse,
  isTrue,
  capitalize,
  isFalseOrNotSet,
  dateNotPassed,
  isLeaveStatus,
  isReactivateStatus,
  isTransferring,
  isSmart1,
  getDurationInWeeks
} from './utils.js'
import { logger } from '@mca/common-logger'
import * as util from 'util'
import config from './config.js'

const require = createRequire(import.meta.url)
const mojFrontendPath = require.resolve(
  '@ministryofjustice/frontend/package.json'
)

const govkukFrontendPath = path.join(
  mojFrontendPath,
  '../../../govuk-frontend/package.json'
)

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
})

function getDate(str, fmt = 'YYYY-MM-DD') {
  try {
    if (isBlank(str)) {
      logger.warn('getDate: date is blank')
      return ''
    } else {
      return moment(str, fmt)
    }
  } catch (error) {
    logger.error('getDate: error ', error)
    return ''
  }
}

function day(date) {
  if (isBlank(date)) {
    return ''
  }
  return getDate(date).date()
}

function month(date) {
  if (isBlank(date)) {
    return ''
  }
  return getDate(date).utc().month() + 1
}

function year(date) {
  if (isBlank(date)) {
    return ''
  }
  return getDate(date).utc().year()
}

function financialYearFormat(str) {
  try {
    if (str) {
      const year2 = parseInt(str) + 1
      return `${str}/${year2.toString().slice(-2)}`
    }
  } catch (err) {
    const msg = `Error parsing year ${str}`
    logger.error(msg, err)
  }

  return str
}

function financialPeriodFormat(str) {
  try {
    if (str) {
      const period = parseInt(str)
      return `P${('0' + period).slice(-2)}`
    }
  } catch (err) {
    const msg = `Error parsing period ${str}`
    logger.error(msg, err)
  }

  return str
}

function configureNunjucks(app) {
  const env = nunjucks.configure(
    [
      path.join(process.cwd(), 'src', 'views'),
      path.join(__dirname, 'views/includes'),
      path.join(__dirname, 'views/components'),
      path.join(govkukFrontendPath, '../'),
      path.join(govkukFrontendPath, '../govuk'),
      path.join(govkukFrontendPath, '../govuk/components'),
      path.join(mojFrontendPath, '../'),
      path.join(mojFrontendPath, '../moj/components')
    ],
    { autoescape: true, express: app }
  )

  env.addFilter('day', day)
  env.addFilter('month', month)
  env.addFilter('year', year)
  env.addFilter('capitalize', capitalize)
  env.addFilter('tostring', function (data) {
    return JSON.stringify(data)
  })

  env.addFilter('findById', (list, id) => {
    return list.find((e) => e.id === id)
  })

  env.addFilter('getStatusCssClass', (status) => {
    switch (status) {
      case 'Active':
      case 'Approved':
      case 'Ready':
      case 'Uploaded':
        return 'govuk-tag--green'
      case 'Review':
      case 'Generating':
        return 'govuk-tag--yellow'
      case 'Pending':
        return 'govuk-tag--grey'
      default:
        return 'govuk-tag--red'
    }
  })

  env.addFilter('getError', function (name, errors) {
    if (Array.isArray(errors) && errors.length > 0) {
      const found = errors.find((e) => e.href && e.href.includes(name))
      if (found) {
        return { text: found.text }
      }
    }
  })

  env.addFilter('getErrorClass', function (name, errors) {
    if (Array.isArray(errors) && errors.length > 0) {
      const found = errors.find((e) => e.href && e.href.includes(name))
      if (found) {
        return 'govuk-input--error'
      }
    }
  })

  env.addFilter('mergeObjects', function (object1, object2) {
    return Object.assign(object1, object2)
  })

  env.addFilter('getErrors', function (errors) {
    if (Array.isArray(errors) && errors.length > 0) {
      let list = errors
      if (errors[0].path) {
        list = errors.map((e) => {
          const p = e.path.split('.')
          const name = p[p.length - 1]
          return { text: e.text, href: `#${name}` }
        })
      }
      return {
        titleText: 'There is a problem',
        errorList: list
      }
    }
  })

  env.addFilter('addErrorClass', function (name, errors) {
    if (Array.isArray(errors) && errors.length > 0) {
      const found = errors.find((e) => e.href && e.href.includes(name))
      if (found) {
        return ' govuk-input--error'
      }
    }
    return ''
  })

  env.addFilter('dateToday', () => {
    return moment().format('YYYY-MM-DD')
  })

  env.addFilter('dateUKFormat', function (str, fmt = 'DD-MM-YYYY') {
    let dt

    if (isBlank(str)) {
      return str
    }

    try {
      dt = moment(str).tz('Europe/London')
    } catch (err) {
      const msg = `Error parsing date ${str}`
      logger.error(msg, err)
      return msg
    }

    try {
      return dt.format(fmt)
    } catch (err) {
      const msg = `Error formatting date ${str} to ${fmt}`
      logger.error(msg, err)
      return msg
    }
  })

  env.addFilter('currencyUK', function (val) {
    if (!val) {
      return currencyFormatter.format(0)
    }
    return currencyFormatter.format(val)
  })

  env.addFilter('weeksFormat', function (val, fmt='w') {
    if (val && typeof val === 'number') {
      return val.toFixed(1) + ' ' + fmt
    } else {
      return val
    }
  })

  env.addFilter('claimType', function (val) {
    if (val === 'trainee_claim') {
      return 'TC'
    } else if (val === 'trainee_balancing_claim') {
      return 'BC'
    } else {
      return 'N/A'
    }
  })

  env.addFilter('financialYearFormat', financialYearFormat)

  env.addFilter('financialPeriodFormat', financialPeriodFormat)

  env.addFilter(
    'dateTimeUKFormat',
    function (str, fmt = 'DD-MM-YYYY, HH:mm:ss z') {
      let dt

      if (isBlank(str)) {
        return str
      }

      try {
        dt = moment(str).tz('Europe/London')
      } catch (err) {
        const msg = `Error parsing date ${str}`
        logger.error(msg, err)
        return msg
      }

      try {
        return dt.format(fmt)
      } catch (err) {
        const msg = `Error formatting date ${str} to ${fmt}`
        logger.error(msg, err)
        return msg
      }
    }
  )

  env.addFilter('getPeriod', getPeriod)

  env.addFilter('mcaDateToPeriod', (dateAsString) => {
    const date = new Date(dateAsString)
    const month =
      date.getMonth() > 2 ? date.getMonth() - 2 : date.getMonth() + 10
    return 'P' + month
  })

  env.addFilter('summariseArray', function (items, key, join = true) {
    if (items && Array.isArray(items)) {
      const summary = items.map((i) => i[key])
      return join ? summary.join(', ') : summary
    }
  })

  env.addFilter('orderToText', function (order) {
    switch (order) {
      case 1:
        return 'First'
      case 2:
        return 'Second'
      case 3:
        return 'Third'
      case 4:
        return 'Forth'
      case 5:
        return 'Fifth'
      default:
        return order.toString()
    }
  })

  env.addFilter('selectAddDefault', function (options, defaultValue) {
    if (Array.isArray(options)) {
      options = [{ value: '', text: `--- ${defaultValue} ---` }, ...options]
    }
    return options
  })

  env.addFilter('selectValue', function (options, value) {
    if (Array.isArray(options)) {
      options.forEach((o) => {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (o.value === v) {
              o.selected = true
              o.checked = true
            }
          })
        } else {
          if (value && o.value === value) {
            o.selected = true
            o.checked = true
          }
        }
      })
    }
    return options
  })

  env.addFilter('underReview', function (data) {
    return data?.status === 'Review'
  })

  env.addFilter('hasPending', function (data) {
    return Array.isArray(data) && data.find((e) => e.status === 'Pending')
  })

  env.addFilter('yearsOptions', function (count = 12) {
    const thisYear = new Date().getFullYear()
    const years = [{ value: '', text: '--- year ---' }]
    for (let year = thisYear; year > thisYear - count; year--) {
      years.push({ value: `${year}`, text: `${year}` })
    }
    return years
  })

  env.addFilter('where', function (array, path, match) {
    if (array && array.filter) {
      return array.filter((item) => {
        if (Array.isArray(match)) {
          return match.indexOf(item[path]) > -1
        } else {
          return item[path] === match
        }
      })
    } else {
      return []
    }
  })

  env.addFilter('yesNo', function (str, alt = 'Unknown') {
    if (isTrue(str)) {
      return 'Yes'
    } else if (isFalse(str)) {
      return 'No'
    } else {
      return alt
    }
  })

  env.addFilter('cleanList', function (array) {
    if (array && array.filter) {
      return array.filter(
        (item) => item !== null && item !== undefined && item !== ''
      )
    } else {
      return []
    }
  })

  env.addFilter('getCurrentRate', getCurrentRate)

  const metaExcludes = [
    'queries',
    'page',
    'pageSize',
    'thisPage',
    'totalItems',
    'totalPages'
  ]

  function pageQuery(meta, page) {
    const newMeta = Object.assign({}, meta)
    newMeta.page = page
    return getQuery(newMeta)
  }

  function getQuery(meta) {
    const params = new URLSearchParams()

    if (meta.page) {
      params.set('page', meta.page)
    }
    if (meta.limit) {
      params.set('limit', meta.limit)
    }
    if (meta.sort) {
      params.set('sort', meta.sort)
    }
    if (meta.order) {
      params.set('order', meta.order)
    }

    if (meta?.queries) {
      Object.keys(meta.queries).forEach((key) => {
        if (meta.queries[key] && !metaExcludes.includes(key)) {
          params.set(key, meta.queries[key])
        }
      })
    }

    return params.toString()
  }

  env.addFilter('pageData', function (meta) {
    const pageItems = []
    const gap = 2
    let start
    let finish
    let endDots = false

    if (meta.totalPages <= 7) {
      // Small number of total pages, fixed size with no dots
      start = 1
      finish = meta.totalPages
    } else if (meta.thisPage < gap + 1) {
      // Near the beginning
      start = meta.thisPage - 1 > 0 ? meta.thisPage - 1 : 1
      finish = start + gap
      endDots = true
    } else if (meta.totalPages - meta.thisPage < gap) {
      // Near the end
      pageItems.push({ text: 1, href: `?${pageQuery(meta, 1)}` })
      pageItems.push({ type: 'dots' })
      start = meta.totalPages - gap
      finish = meta.totalPages
    } else {
      // In the middle
      start = meta.thisPage - 1
      finish = meta.thisPage + 1
      pageItems.push({ text: 1, href: `?${pageQuery(meta, 1)}` })
      pageItems.push({ type: 'dots' })
      endDots = true
    }

    for (start; start <= finish; start++) {
      if (meta.thisPage === start) {
        pageItems.push({ text: start, selected: true })
      } else {
        pageItems.push({ text: start, href: `?${pageQuery(meta, start)}` })
      }
    }

    if (endDots) {
      pageItems.push({ type: 'dots' })
      pageItems.push({
        text: meta.totalPages,
        href: `?${pageQuery(meta, meta.totalPages)}`
      })
    }

    const to = parseInt(meta.thisPage) * parseInt(meta.limit)
    const data = {
      results: {
        count: parseInt(meta.totalItems),
        from: to - parseInt(meta.limit) + 1,
        to:
          parseInt(meta.thisPage) === parseInt(meta.totalPages)
            ? parseInt(meta.totalItems)
            : to,
        text: 'results'
      },
      items: pageItems
    }

    if (parseInt(meta.totalPages) > 1 && parseInt(meta.thisPage) > 1) {
      data.previous = {
        text: 'Previous',
        href: `?${pageQuery(meta, parseInt(meta.thisPage) - 1)}`
      }
    }
    if (
      parseInt(meta.totalPages) > 1 &&
      parseInt(meta.thisPage) < parseInt(meta.totalPages)
    ) {
      data.next = {
        text: 'Next',
        href: `?${pageQuery(meta, parseInt(meta.thisPage) + 1)}`
      }
    }

    return data
  })

  env.addFilter('isTrue', isTrue)
  env.addFilter('isArray', Array.isArray)
  env.addFilter('isFalse', isFalse)
  env.addFilter('isFalseOrNotSet', isFalseOrNotSet)
  env.addFilter('isLeaveStatus', isLeaveStatus)
  env.addFilter('isReactivateStatus', isReactivateStatus)
  env.addFilter('isTransferring', isTransferring)
  env.addFilter('isSmart1', isSmart1)

  function govDate(timestamp) {
    return moment(timestamp).format('D MMMM YYYY')
  }

  function govShortDate(timestamp) {
    return moment(timestamp).format('D MMM YYYY')
  }

  function govTime(timestamp) {
    const t = moment(timestamp)
    if (t.minutes() > 0) {
      return t.format('h:mma')
    } else {
      return t.format('ha')
    }
  }
  env.addFilter('mojDate', function (timestamp, type) {
    switch (type) {
      case 'datetime':
        return govDate(timestamp) + ' at ' + govTime(timestamp)
      case 'shortdatetime':
        return govShortDate(timestamp) + ' at ' + govTime(timestamp)
      case 'date':
        return govDate(timestamp)
      case 'shortdate':
        return govShortDate(timestamp)
      case 'time':
        return govTime(timestamp)
      default:
        return timestamp
    }
  })

  env.addGlobal('getTitle', function (includeEnv = true) {
    if (includeEnv && env !== 'LIVE') {
      const env = (process.env.NODE_ENV || 'dev').toUpperCase()
      return `SMarT - ${env}`
    } else {
      return 'SMarT'
    }
  })

  env.addGlobal('getEnv', function () {
    return (process.env.NODE_ENV || 'dev').toUpperCase()
  })

  env.addGlobal('getDescription', function () {
    const env = (process.env.NODE_ENV || 'dev').toUpperCase()
    if (env !== 'LIVE') {
      return `SMarT ${env} site`
    } else {
      return 'Support for Maritime Training (SMarT) is a government funded scheme created to increase the number of qualified seafarers in the UK maritime industry'
    }
  })

  // handy for debugging
  env.addGlobal('getContext', function () {
    return util.inspect(this.ctx)
  })

  env.addGlobal(
    'getYearsOptions',
    function (start, count = 10, order = 'desc') {
      const years = [{ value: '', text: '--- year ---' }]
      if (order === 'desc') {
        for (let year = start; year > start - count; year--) {
          years.push({ value: `${year}`, text: `${financialYearFormat(year)}` })
        }
      } else {
        for (let year = start - count; year < start; year++) {
          years.push({ value: `${year}`, text: `${financialYearFormat(year)}` })
        }
      }
      return years
    }
  )

  env.addGlobal(
    'canGenerateForecast',
    function (
      forecastType,
      requestedYear,
      requestedPeriod,
      currentYear,
      currentPeriod,
      forecastMissing
    ) {
      // Removing all date based restrictions on forecast generation

      // ensure they are all ints
      requestedYear = parseInt(requestedYear)
      requestedPeriod = parseInt(requestedPeriod)
      currentYear = parseInt(currentYear)
      currentPeriod = parseInt(currentPeriod)
      console.log(forecastType)
      console.log(currentYear)
      if (forecastType === 'monthly') {
        return requestedYear === currentYear
      } else if (forecastType === 'annual') {
        return (
          (forecastMissing && requestedYear === currentYear) ||
          (requestedYear > currentYear && requestedYear - currentYear < 3) ||
          (requestedYear === currentYear && currentPeriod < 4)
        )
      } else {
        logger.error(
          'canGenerateForecast: unknown forecastType ' + forecastType
        )
        return false
      }

      return true
    }
  )

  env.addGlobal('enableAV', config.features.enableAV)

  env.addGlobal('getDurationInWeeks', getDurationInWeeks)

  // Used for currencies
  require('useful-nunjucks-filters')(env)
}

export { configureNunjucks, financialYearFormat, financialPeriodFormat }
