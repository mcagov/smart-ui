'use strict'
import express from 'express'
import compression from 'compression'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import path from 'path'
import formData from 'express-form-data'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { expressLogger, logger } from '@mca/common-logger'
import nocache from 'nocache'
import onHeaders from 'on-headers'

import index from './routes/index.js'
import auth from './routes/auth.js'
import users from './routes/users.js'
import feedback from './routes/feedback.js'
import providers from './routes/providers.js'
import training from './routes/training.js'
import tpTrainees from './routes/tptrainees.js'
import comments from './routes/comments.js'
import forecasts from './routes/all-forecasts.js'
import claims from './routes/all-claims.js'
import trainees from './routes/trainees.js'
import trainingsItems from './routes/training-items.mjs'
import clientCompanies from './routes/client-companies.mjs'
import reports from './routes/reports.mjs'
import smartCategories from './routes/smart-categories.mjs'
import smartItems from './routes/smart-items.mjs'
import paymentSchedules from './routes/payment-schedules.mjs'
import api from './routes/api.js'
import apiReports from './routes/api-reports.js'
import config from './config.js'
import { handleCookies } from './cookies.js'
import { configureNunjucks } from './nunjucks.js'
import { initialiseErrors } from './errors.js'
import { initializeOkta } from './okta-oidc.js'
import { initialiseSession } from './session.js'
import { setUserContext, useView } from './controllers/common.js'
import { ensureAuthenticatedLocal, initializeLocal } from './local-oidc.js'
import { useLocalAuth } from './utils.js'
// import { setupRequestLogging } from './request-logger.js'
import { configureHelmet } from './helmet.js'
import favicon from 'serve-favicon'

// TODO sort out XRAY or use AWS Open Distro for OpenTelemetry
// import XRay from 'aws-xray-sdk'
import { ensureAuthenticatedOkta, isAb } from './controllers/auth.js'
import { getTP } from './controllers/lookups/providers.js'
import Cache from './services/cache.mjs'

const csrf = csurf({ cookie: true })

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// const XRay = require('aws-xray-sdk')

// if (config.features.logOutgoingRequests) {
//   setupRequestLogging()
// }

const app = express()
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.locals.googleId = process.env.GOOGLE_ID
initialiseSession(app)

const jqueryPath = require.resolve('jquery/package.json')
const mojFrontendPath = require.resolve('@ministryofjustice/frontend/package.json')
const govkukFrontendPath = require.resolve('govuk-frontend/package.json')
const env = (process.env.NODE_ENV || 'dev').toLowerCase()

// TODO: sort out XRAY or use AWS Open Distro for OpenTelemetry
// if (config.features.xray) {
//   XRay.config([XRay.plugins.ECSPlugin])
//   logger.info('AWS XRay has been configured.')
// } else {
//   logger.warn('AWS XRay DISABLED.')
// }

app.use(expressLogger)

logger.info(`SMART_API: ${process.env.SMART_API}`)
let oidc
let ensureAuthenticated

if (useLocalAuth()) {
  logger.warn('Using local Auth')
  oidc = initializeLocal(app)
  ensureAuthenticated = ensureAuthenticatedLocal(oidc)
} else {
  logger.info('Using Okta Auth')
  logger.info(process.env.LOCAL_AUTH)
  oidc = initializeOkta(app)
  ensureAuthenticated = ensureAuthenticatedOkta(oidc)
}

const cache = new Cache()

const setCsrf = function(req, res, next) {
  if (req && req.csrfToken) {
    res.locals.csrfToken = req.csrfToken()
  }
  next()
}

app.use(compression())
app.use(cookieParser())
configureHelmet(app)
app.use(setUserContext)
configureNunjucks(app)
app.set('view engine', 'html')

// TODO: sort out XRAY or use AWS Open Distro for OpenTelemetry
// app.use(XRay.express.openSegment('smart-ui-' + env))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(handleCookies(app, csrf))
app.use(formData.parse({}))
app.use(formData.union())

app.use('/assets', express.static(path.join(govkukFrontendPath, '../dist/govuk/assets')))
app.use('/assets/images/icon-tag-remove-cross.svg', express.static(path.join(mojFrontendPath, '../moj/assets/images/icon-tag-remove-cross.svg')))
app.use('/assets/images/icon-tag-remove-cross-white.svg', express.static(path.join(mojFrontendPath, '../moj/assets/images/icon-tag-remove-cross-white.svg')))

app.use('/assets/images/icon-arrow-white-up.svg', express.static(path.join(mojFrontendPath, '../moj/assets/images/icon-arrow-white-up.svg')))
app.use('/assets/images/icon-arrow-white-down.svg', express.static(path.join(mojFrontendPath, '../moj/assets/images/icon-arrow-white-down.svg')))
app.use('/assets/images/icon-arrow-black-down.svg', express.static(path.join(mojFrontendPath, '../moj/assets/images/icon-arrow-black-down.svg')))

// app.use('/assets/js/jquery.js', express.static(path.join(__dirname, '../node_modules/jquery/dist/jquery.js')))
app.use('/assets/js/jquery.js', express.static(path.join(jqueryPath, '../dist/jquery.js')))
app.use('/assets/js/govuk-frontend.min.js', express.static(path.join(govkukFrontendPath, '../dist/govuk/govuk-frontend.min.js')))
app.use('/assets/js/govuk-frontend.min.js.map', express.static(path.join(govkukFrontendPath, '../dist/govuk/govuk-frontend.min.js.map')))
app.use('/assets/js/moj-frontend.min.js', express.static(path.join(mojFrontendPath, '../moj/moj-frontend.min.js')))
app.use('/assets/js/moj-frontend.min.js.map', express.static(path.join(mojFrontendPath, '../moj/moj-frontend.min.js.map')))

app.use('/public', express.static(path.join(process.cwd(), 'public')))

// disable caching of dynamic pages
app.use(nocache())
app.use((req, res, next) => {
  // listen for the headers event
  onHeaders(res, () => {
    res.removeHeader('ETag')
  })
  next()
})

app.use('/', csrf, setCsrf, index)
app.use('/', csrf, setCsrf, auth)

app.use('/training-providers/:id', ensureAuthenticated, getTP())

app.use('/training-providers', ensureAuthenticated, csrf, setCsrf, providers)
// TODO: move these into the above providers router
app.use('/training-providers/:id/users', ensureAuthenticated, csrf, setCsrf, users)
app.use('/training-providers/:id/trainees', ensureAuthenticated, csrf, setCsrf, tpTrainees)
app.use('/training-providers/:id/trainings', ensureAuthenticated, csrf, setCsrf, training)

app.use('/comments', ensureAuthenticated, csrf, setCsrf, comments)
app.use('/claims', ensureAuthenticated, csrf, setCsrf, claims)
app.use('/forecasts', ensureAuthenticated, csrf, setCsrf, forecasts)
app.use('/trainees', ensureAuthenticated, csrf, setCsrf, trainees)
app.use('/feedback', ensureAuthenticated, csrf, setCsrf, feedback)
app.use('/client-companies', ensureAuthenticated, isAb, csrf, setCsrf, clientCompanies)
app.use('/training-items', ensureAuthenticated, isAb, csrf, setCsrf, trainingsItems)
app.use('/smart-categories', ensureAuthenticated, isAb, csrf, setCsrf, smartCategories)
app.use('/smart-items', ensureAuthenticated, isAb, csrf, setCsrf, smartItems)
app.use('/payment-schedules', ensureAuthenticated, isAb, csrf, setCsrf, paymentSchedules)
app.use('/admin', ensureAuthenticated, isAb, csrf, setCsrf, useView('admin'))
app.use('/reports', ensureAuthenticated, isAb, csrf, setCsrf, reports)
app.use('/api', ensureAuthenticated, api)
app.use('/api/reports', ensureAuthenticated, apiReports)

initialiseErrors(app)
// TODO: sort out XRAY or use AWS Open Distro for OpenTelemetry
// if (config.features.xray) {
//   app.use(XRay.express.closeSegment())
// }

// export default { app, oidc }
export { app, oidc, cache }
