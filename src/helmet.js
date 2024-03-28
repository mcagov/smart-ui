import helmet from 'helmet'
import { randomUUID } from 'crypto'

const GDS_NONCE = 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='

function configureHelmet (app) {
  app.use(function (req, res, next) {
    res.locals.cspNonce = new Buffer(randomUUID()).toString('base64')
    next()
  })
  // Access to XMLHttpRequest has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        formAction: ["'self'", `${process.env.OKTA_ORG_URL}`],
        scriptSrc: [
          "'self'",
          `'${GDS_NONCE}'`,
          '*.googletagmanager.com',
          '*.google-analytics.com',
          '*.s3.eu-west-2.amazonaws.com',
          '*.service.local.smart.mcga.uk',
          (req, res) => `'nonce-${res.locals.cspNonce}'`
        ],
        'img-src': [
          "'self'",
          '*.google-analytics.com',
          '*.googletagmanager.com'
        ],
        'font-src': [
          "'self'",
          '*.google-analytics.com',
          '*.googletagmanager.com'
        ],
        'frame-src': [
          "'self'",
          '*.google-analytics.com',
          '*.googletagmanager.com'
        ],
        'connect-src': [
          "'self'",
          '*.google-analytics.com',
          '*.analytics.google.com',
          '*.googletagmanager.com',
          '*.s3.eu-west-2.amazonaws.com',
          '*.aws.local.smart.mcga.uk',
          'aws.local.smart.mcga.uk',
          '*.service.local.smart.mcga.uk',
          'localhost.localstack.cloud:4566',
          '*.localhost.localstack.cloud:4566'
        ]
      }
    })
  )
}

export { configureHelmet }
