import { logger } from '@mca/common-logger'
import Attachments from '../services/attachments.js'
import { validationResult } from 'express-validator'
import {
  getAccessToken,
  govUKErrors,
  notEmptyArray,
  useLocalAuth
} from '../utils.js'
import assert from 'assert'
import {
  getQueryParams,
  handleLookupError,
  setPageMeta
} from './lookups/common.js'
import createError from 'http-errors'
import LocalUsers from '../services/local.users.js'
import OktaUsers from '../services/okta.users.js'
import TrainingProviders from '../services/trainingproviders.js'
import config from '../config.js'
import moment from 'moment'

const attachments = new Attachments()
const trainingProviders = new TrainingProviders()
let service

if (useLocalAuth()) {
  logger.info('Using LocalUsers')
  service = new LocalUsers()
} else {
  logger.info('Using Okta Users')
  service = new OktaUsers()
}

const attachmentTypes = [
  {
    description: 'Certificate of incorporation',
    fileType: 'certificate-of-incorporation'
  },
  {
    description: 'Training provider agreement',
    fileType: 'training-provider-agreement'
  },
  { description: 'General', fileType: 'general' },
  { description: 'Other', fileType: 'other' }
]

export function create(req, res, next) {
  const body = {
    resourceUrl: res.locals.resourceUrl,
    fileName: req.body.fileName,
    fileType: req.body.fileType,
    contentType: req.body.contentType,
    description: 'Uploaded by SMarT'
  }

  if (req.params.id) {
    body.org = req.params.id
  }

  // default expiry for audit files - 10 years
  if (res.locals.resourceUrl.endsWith('audit')) {
    body.expiry = moment().add(90, 'days').toISOString()
  } else {
    body.expiry = moment().add(28, 'days').toISOString()
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: govUKErrors(errors.errors),
      message: req.body.message
    })
  } else {
    attachments
      .create(getAccessToken(req), body)
      .then((a) => {
        res.status(201).json(a)
      })
      .catch(next)
  }
}

export function update(req, res, next) {
  const body = {
    status: config.features.enableAV ? 'Pending' : 'Uploaded'
  }
  if (res.locals.attachment.org) {
    body.org = res.locals.attachment.org
  }
  console.log(`body: ${JSON.stringify(body)}`)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: govUKErrors(errors.errors),
      absence: body
    })
  } else {
    attachments
      .put(getAccessToken(req), req.params.attachmentId, body)
      .then((a) => {
        res.status(200).json(a)
      })
      .catch(next)
  }
}

export function del(req, res, next) {
  attachments
    .del(getAccessToken(req), req.params.attachmentId)
    .then((a) => {
      res.status(200).json(a)
    })
    .catch(next)
}

export function get(failSilent = false) {
  return async function (req, res, next) {
    try {
      assert.ok(req.params.attachmentId, 'req.params.attachmentId is not set')
      res.locals.attachment = await attachments.get(
        getAccessToken(req),
        req.params.attachmentId
      )
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function redirect(req, res, next) {
  if (res.locals.attachment) {
    res.redirect(res.locals.attachment.presigned.url)
  } else {
    next(
      createError(
        404,
        `Attachment ${res.locals.attachment.id}/${res.locals.attachment.fileName} not found`
      )
    )
  }
}

export function all(failSilent = false) {
  return async function (req, res, next) {
    try {
      const queryKeys = ['fileType', 'status']
      const params = getQueryParams(req, queryKeys, 'updated', 100)
      if (res.locals.resourceUrl) {
        params.resourceUrl = res.locals.resourceUrl
      }
      if (req.params.id) {
        params.org = req.params.id
        res.locals.org = req.params.id
      }
      res.locals.attachments = await attachments.all(
        getAccessToken(req),
        params
      )
      setPageMeta(req, res.locals.attachments, queryKeys)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export async function setContext(req, res, next) {
  try {
    const allUserIds = new Set()
    const allTpIds = new Set()

    if (notEmptyArray(res?.locals?.attachments?.data)) {
      res.locals.attachments.data.forEach((attachment) => {
        allUserIds.add(attachment.userId)
        allTpIds.add(attachment.org)
        if (attachment.resourceUrl) {
          if (attachment.resourceUrl.endsWith('audit')) {
            attachment.resourceName = 'Audit'
          } else if (attachment.resourceUrl.includes('/trainees/')) {
            attachment.resourceName = 'Trainee'
          } else {
            attachment.resourceName = 'Resource'
          }
        }
      })
    }

    if (allUserIds.size > 0) {
      logger.debug(
        `Found ${[...allUserIds]} user IDs in page, fetching the names`
      )
      // TODO cache
      const users = await service.getAll([...allUserIds])
      if (notEmptyArray(res?.locals?.attachments?.data)) {
        res.locals.attachments.data.forEach((attachment) => {
          const user = users.find((u) => u.id === attachment.userId)
          if (user) {
            attachment.userName = `${user.profile.firstName} ${user.profile.lastName}`
          } else {
            attachment.userName = attachment.userId
          }
        })
      }
    }

    // get TPs
    if (allTpIds.size > 0) {
      logger.debug(
        `Found ${JSON.stringify(
          ...allTpIds
        )} tp IDs in page, fetching the names`
      )
      // TODO cache
      const tps = await trainingProviders.getNames(getAccessToken(req), [
        ...allTpIds
      ])
      logger.debug(`Got back  ${JSON.stringify(tps)}`)
      if (notEmptyArray(res?.locals?.attachments?.data)) {
        res.locals.attachments.data.forEach((attachment) => {
          const tp = tps.find((tp) => tp.id === attachment.org)
          attachment.tpName = tp.companyName
        })
      }

      if (res?.locals?.attachment?.org) {
        const tp = tps.find((tp) => tp.id === res.locals.attachment.org)
        if (tp) {
          res.locals.attachment.tpName = tp.companyName
        }
      }
    }
    next()
  } catch (err) {
    handleLookupError(err, next, true)
  }
}

export function allContext(req, res, next) {
  res.locals.attachmentTypes = attachmentTypes
  next()
}
