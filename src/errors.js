import createError from 'http-errors'
import config from './config.js'
import { logger } from '@mca/common-logger'
import PrettyError from 'pretty-error'

function initialiseErrors (app) {
  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    logger.error(`creating a 404 for ${req.originalUrl}`)
    next(createError(404))
  })

  // error handler
  app.use(function (err, req, res, next) {
    if (config.features.prettyErrors) {
      const pe = new PrettyError()
      logger.error(pe.render(err))
    } else {
      logger.error(err)
    }
    let page = '500'
    switch (err.status) {
      case 500:
        break
      case 400:
        page = '400'
        break
      case 403:
        page = '403'
        break
      case 404:
        page = '404'
        break
    }
    res.status(err.status || 500)
    if (err && err.response && err.response.body && err.response.body.message) {
      res.render(`errors/${page}.html`, { error: err.response.body })
    } else {
      res.render(`errors/${page}.html`, { error: err })
    }
  })
}

export { initialiseErrors }
