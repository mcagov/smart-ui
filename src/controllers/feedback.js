import { logger } from '@mca/common-logger'
import btoa from 'btoa'
import request from 'superagent'
import { validationResult } from 'express-validator'
import { govUKErrors } from '../utils.js'

import { config } from 'dotenv'
import createError from 'http-errors'

config()

const token = btoa(`${process.env.ATLAS_USER}:${process.env.ATLAS_TOKEN}`)
const JIRA_URL = process.env.ATLAS_URL

function createIssue (data) {
  const url = `${JIRA_URL}/rest/api/3/issue`
  const issueJson = {
    fields: {
      summary: data.summary,
      issuetype: { id: '10127' },
      project: { id: '10024', key: 'STF' },
      customfield_10114: { value: data.satisfaction },
      labels: ['mca-smarts-feedback'],
      description: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: data.description }] }]
      }
    }
  }

  if (data.name || data.email) {
    const userPara = { type: 'paragraph', content: [] }
    if (data.name) {
      userPara.content.push({ type: 'text', text: 'Reporter', marks: [{ type: 'strong' }] })
      userPara.content.push({ type: 'text', text: `: ${data.name}` })
      userPara.content.push({ type: 'hardBreak' })
    }
    if (data.email) {
      userPara.content.push({ type: 'text', text: 'E-mail', marks: [{ type: 'strong' }] })
      userPara.content.push({ type: 'text', text: ': ' })
      userPara.content.push({
        type: 'text',
        text: data.email,
        marks: [{ type: 'link', attrs: { href: `mailto:${data.email}` } }]
      })
    }
    issueJson.fields.description.content[1] = userPara
  }

  if (data.environment) {
    issueJson.fields.environment = {
      version: 1,
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Referrer', marks: [{ type: 'strong' }] },
          { type: 'text', text: ': ' },
          {
            type: 'text',
            text: data.environment.referer,
            marks: [{ type: 'link', attrs: { href: data.environment.referer } }]
          },
          { type: 'hardBreak' },
          { type: 'text', text: 'User-Agent', marks: [{ type: 'strong' }] },
          { type: 'text', text: `: ${data.environment.userAgent}` },
          { type: 'hardBreak' },
          { type: 'text', text: 'Screen Resolution', marks: [{ type: 'strong' }] },
          { type: 'text', text: `: ${data.environment.screenResolution}` }
        ]
      }]
    }
  }

  return request
    .post(url)
    .send(issueJson)
    .set('Authorization', `Basic ${token}`)
}

function postFeedback (req, res, next) {
  const data = {
    satisfaction: req.body.satisfaction,
    summary: req.body.summary,
    description: req.body.description,
    includeEnvironment: req.body.includeEnvironment,
    includePersonal: req.body.includePersonal
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(401).render('public/feedback', {
      data,
      error: govUKErrors(errors.errors)
    })
  } else {
    if (req.body.includeEnvironment === 'true') {
      data.environment = {
        referer: req.headers.referer,
        userAgent: req.headers['user-agent'],
        screenResolution: req.body.resolution
      }
    }
    createIssue(data)
      .then((issue) => {
        res.render('public/feedback', {
          status: 'success',
          data,
          issueUrl: `${JIRA_URL}/browse/${issue.body.key}`,
          issue: issue.body
        })
      })
      .catch((err) => {
        logger.error(`error= ${JSON.stringify(err)}, data=${JSON.stringify(data)}`)
        next(createError(500, 'There is a problem with the feedback service, please try again later.'))
      })
  }
}

function feedbackPage (req, res) {
  res.render('public/feedback', {})
}

export default {
  postFeedback,
  feedbackPage
}
