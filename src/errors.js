import createError from 'http-errors'
import config from './config.js'
import { logger } from '@mca/common-logger'
import PrettyError from 'pretty-error'

function initialiseErrors (app) {
  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404))
  })

  // error handler
  app.use(function (err, req, res, next) {
    if (err.status === 404) {
      logger.warn(`404 for ${req.originalUrl}`)
    } else if (config.features.prettyErrors) {
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
    const csrfFailure = err.code === 'EBADCSRFTOKEN'
    if (err && err.response && err.response.body && err.response.body.message) {
      res.render(`errors/${page}.html`, { error: err.response.body, csrfFailure })
    } else {
      res.render(`errors/${page}.html`, { error: err, csrfFailure })
    }
  })
}

export { initialiseErrors }
