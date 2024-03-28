import assert from 'assert'
import { validationResult } from 'express-validator'
import Comments from '../services/comments.js'
import { handleRedirect } from './common.js'
import { contains, getAccessToken, govUKErrors, hasRole, isBlank, notEmptyArray, startsWith, useLocalAuth } from '../utils.js'
import { getQueryParams, handleLookupError, setPageMeta } from './lookups/common.js'
import OktaUsers from '../services/okta.users.js'
import { logger } from '@mca/common-logger'
import LocalUsers from '../services/local.users.js'
import TrainingProviders from '../services/trainingproviders.js'
import Trainees from '../services/trainees.js'

const comments = new Comments()
const trainingProviders = new TrainingProviders()
const trainees = new Trainees()
let service = new OktaUsers()

if (useLocalAuth()) {
  logger.info('Using LocalUsers')
  service = new LocalUsers()
}

function getPath (req, res) {
  return req.originalUrl.substring(0, req.originalUrl.indexOf('/comments')) + '/comments'
}

function getRedirect (req, res) {
  return getPath(req, res) + '?resolved=false'
}

export function create (req, res, next) {
  assert.ok(req.params.id, 'req.params.id is not set')
  const body = {
    resourceUrl: res.locals.resourceUrl,
    subject: res.locals.resourceSubject,
    org: req.params.id,
    labels: [`entity:${res.locals.resourceName}`],
    message: {
      message: req.body.message
    }
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render('comments/list', {
      errors: govUKErrors(errors.errors),
      comment: body
    })
  } else {
    const body = {
      resourceUrl: res.locals.resourceUrl,
      subject: res.locals.resourceSubject,
      org: req.params.id,
      labels: [`entity:${res.locals.resourceName}`],
      message: {
        message: req.body.message
      }
    }
    if (hasRole(req, 'admin')) {
      body.message.labels = ['to:TP']
    } else {
      body.message.labels = ['to:AB']
    }
    comments
      .create(getAccessToken(req), body)
      .then(comment => { handleRedirect(res, req.query.return, `${getPath(req, res)}/${comment.id}/messages`) })
      .catch(next)
  }
}

export function reply (req, res, next) {
  const body = {
    message: req.body.message
  }

  if (hasRole(req, 'admin')) {
    body.labels = ['to:TP']
  } else {
    body.labels = ['to:AB']
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).render('comments/messages', {
      errors: govUKErrors(errors.errors)
    })
  } else {
    comments
      .reply(getAccessToken(req), req.params.commentId, body)
      .then(_ => { handleRedirect(res, req.query.return, `${getPath(req, res)}/${req.params.commentId}/messages#message_last`) })
      .catch(next)
  }
}

export function resolve (req, res, next) {
  comments
    .resolve(getAccessToken(req), req.params.commentId)
    .then(_ => { handleRedirect(res, req.query.return, getRedirect(req, res)) })
    .catch(next)
}

const traineeRegEx = /.*\/training-providers\/[^/]*\/trainees\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}).*/

export async function fixSubjectName (token, commentId, resourceUrl) {
  const matches = resourceUrl.match(traineeRegEx)
  if (matches.length > 1) {
    const traineeId = matches[1]
    logger.debug(`looking up trainee  ${traineeId}`)
    const trainee = await trainees.get(token, traineeId)
    let subject
    if (trainee.contactName) {
      subject = `Trainee ${trainee.contactName}`
    } else if (trainee.matsuNumber) {
      subject = `Trainee ${trainee.matsuNumber}`
    } else {
      subject = `Trainee ${traineeId}`
    }

    logger.info(`fixSubjectName: setting subject to ${subject}`)

    return await comments.put(token, commentId, { subject })
  }
}

export function getComment (failSilent = false) {
  return async function (req, res, next) {
    try {
      const params = getQueryParams(req, [], 'created', 1000)
      assert.ok(req.params.commentId, 'req.params.commentId is not set')
      const token = getAccessToken(req)
      res.locals.comment = await comments.get(token, req.params.commentId)
      // fix messed up subjects
      if (contains(res.locals?.comment?.subject, 'undefined')) {
        try {
          res.locals.comment = await fixSubjectName(token, req.params.commentId, res.locals.comment.resourceUrl)
        } catch (err) {
          logger.error('getComment: fixSubjectName: error occurred', err)
        }
      }
      for (const label of res.locals.comment.labels) {
        if (startsWith(label, 'entity:')) {
          res.locals.comment.resourceName = label.substring(7)
        }
      }
      res.locals.messages = await comments.messages(token, req.params.commentId, params)
      res.locals.baseUrl = getPath(req, res)
      setPageMeta(req, res.locals.messages)

      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export function getComments (failSilent = false) {
  return async function (req, res, next) {
    try {
      const queryKeys = ['resolved']
      if (isBlank(req.query.sort)) {
        req.query.sort = 'updated'
        req.query.order = 'desc'
      }
      const params = getQueryParams(req, queryKeys, '', 10)
      if (res.locals.resourceUrl) {
        params.resourceUrl = res.locals.resourceUrl
      }
      if (req.params.id) {
        params.org = req.params.id
      }
      res.locals.comments = await comments.all(getAccessToken(req), params)
      setPageMeta(req, res.locals.comments, queryKeys)
      res.locals.baseUrl = getPath(req, res)
      next()
    } catch (err) {
      handleLookupError(err, next, failSilent)
    }
  }
}

export async function setCommenters (req, res, next) {
  try {
    const allUserIds = new Set()
    const allTpIds = new Set()

    if (notEmptyArray(res?.locals?.comments?.data)) {
      res.locals.comments.data.forEach((c) => {
        allUserIds.add(c.userId)
        allTpIds.add(c.org)
      })
    }

    if (notEmptyArray(res?.locals?.messages?.data)) {
      res.locals.messages.data.forEach((c) => {
        allUserIds.add(c.userId)
      })
    }

    if (res?.locals?.comment?.userId) {
      allUserIds.add(res.locals.comment.userId)
    }

    if (res?.locals?.comment?.org) {
      allTpIds.add(res.locals.comment.org)
    }

    if (allUserIds.size > 0) {
      logger.debug(`Found ${[...allUserIds]} user IDs in page, fetching the names`)
      // TODO cache
      const users = await service.getAll([...allUserIds])
      if (notEmptyArray(res?.locals?.comments?.data)) {
        res.locals.comments.data.forEach((c) => {
          const user = users.find((u) => u.id === c.userId)
          if (user) {
            c.userName = `${user.profile.firstName} ${user.profile.lastName}`
          }
        })
      }
      if (notEmptyArray(res?.locals?.messages?.data)) {
        res.locals.messages.data.forEach((c) => {
          const user = users.find((u) => u.id === c.userId)
          if (user) {
            c.userName = `${user.profile.firstName} ${user.profile.lastName}`
          }
        })
      }

      if (res?.locals?.comment?.userId) {
        const user = users.find((u) => u.id === res.locals.comment.userId)
        if (user) {
          res.locals.comment.userName = `${user.profile.firstName} ${user.profile.lastName}`
        }
      }
    }

    // get TPs
    if (allTpIds.size > 0) {
      logger.debug(`Found ${JSON.stringify(...allTpIds)} tp IDs in page, fetching the names`)
      // TODO cache
      const tps = await trainingProviders.getNames(getAccessToken(req), [...allTpIds])
      logger.debug(`Got back  ${JSON.stringify(tps)}`)
      if (notEmptyArray(res?.locals?.comments?.data)) {
        res.locals.comments.data.forEach((c) => {
          const tp = tps.find((tp) => tp.id === c.org)
          c.tpName = tp.companyName
        })
      }

      if (res?.locals?.comment?.org) {
        const tp = tps.find((tp) => tp.id === res.locals.comment.org)
        if (tp) {
          res.locals.comment.tpName = tp.companyName
        }
      }
    }
    next()
  } catch (err) {
    handleLookupError(err, next, true)
  }
}
