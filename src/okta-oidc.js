import jwt_decode from 'jwt-decode'
import request from 'superagent'
import { logger } from '@mca/common-logger'
import pkg from '@okta/oidc-middleware'
import btoa from 'btoa'
import { setUserContext } from './controllers/common.js'
import { checkScopes } from './controllers/auth.js'
import { contains, isBlank } from './utils.js'

const { ExpressOIDC } = pkg

const issuer = process.env.OKTA_ISSUER_URL

const initializeOkta = (app) => {
  const oidc = new ExpressOIDC({
    issuer,
    timeout: 15000,
    client_id: process.env.OKTA_CLIENT_ID,
    client_secret: process.env.OKTA_CLIENT_SECRET,
    appBaseUrl: process.env.APP_BASE_URL,
    scope: process.env.OKTA_SCOPE,
    logoutRedirectUri: `${process.env.APP_BASE_URL}/logout/callback`,
    routes: {
      login: {
        viewHandler: (req, res, next) => {
          res.redirect('/signin')
        }
      },
      loginCallback: {
        afterCallback: '/signin/callback'
      }
    },
    testing: {
      disableHttpsCheck: true
    }

  })

  app.use(oidc.router)

  // callback route after logging out
  oidc.router.get('/logout/callback', (req, res, next) => {
    logger.debug('in logout callback')
    req.logout((err) => {
      if (err) {
        logger.error('Error while calling logout', err)
        next(err)
      } else {
        // passport says you dont need this
        if (req.session && req.session.destroy) {
          req.session.destroy(function (err) {
            if (err) {
              logger.error('Error while calling session.destroy', err)
              next(err)
            } else {
              logger.debug('session should be dead')
              res.redirect('/')
            }
          })
        } else {
          res.redirect('/')
        }
      }
    })
  })

  // get the scopes after login
  oidc.router.get('/signin/callback', setUserContext, checkScopes, (req, res, next) => {
    const returnTo = req?.session?.returnTo
    if (isBlank(returnTo) || contains(returnTo, '/callback') || contains(returnTo, '/signin')) {
      logger.debug('in /signin/callback - redirecting to /')
      res.redirect('/')
    } else {
      logger.debug(`in /signin/callback - redirecting to ${returnTo}}`)
      res.redirect(returnTo)
    }
  })

  oidc.refreshTokenIfRequired = function (req, res, next) {
    logger.debug('refreshTokenIfRequired: called')
    if (req.userContext && req.userContext.tokens) {
      const accessToken = req.userContext.tokens.access_token
      const refreshToken = req.userContext.tokens.refresh_token
      const username = req.userContext.userinfo ? req.userContext.userinfo.preferred_username : 'N/A'

      if (refreshToken) {
        logger.debug('refreshTokenIfRequired: checking if refresh is required for ' + username)
        if (_tokenNeedsRefreshing(accessToken)) {
          logger.debug('refreshTokenIfRequired: refresh IS required for ' + username)
          const scopes = res.locals?.user?.role === 'admin' ? process.env.OKTA_SCOPE_AB : process.env.OKTA_SCOPE_TP
          // const scopes = process.env.OKTA_SCOPE

          return getToken('refresh_token', scopes, refreshToken)
            .then((refreshedToken) => {
              if (refreshedToken) {
                logger.debug(`refreshTokenIfRequired: token refreshed and set in context for ${username} - redirecting to /signin`)
                req.userContext.tokens = refreshedToken
                next()
              } else {
                // TODO force logout?
                logger.error('refreshTokenIfRequired: token is empty - FAILED to refresh token for ' + username)
                res.redirect('/signin')
              }
            }).catch((err) => {
              logger.error('refreshTokenIfRequired: error - FAILED to refresh token for ' + username, err)
              next(err)
            })
        } else {
          next()
        }
      } else {
        logger.error('refreshToken not found - redirecting to /signin')
        res.redirect('/signin')
      }
    } else {
      logger.error('req.userContext or req.userContext.tokens missing - redirecting to /signin')
      res.redirect('/signin')
    }
  }

  return oidc
}

function _tokenNeedsRefreshing (token) {
  const decoded = jwt_decode(token)
  logger.debug('refreshTokenIfRequired: token will be refreshed at or after ' + new Date((decoded.exp - 60) * 1000))
  return new Date((decoded.exp - 60) * 1000) < new Date()
}

function getToken (type = 'client_credentials', scope = 'api', refreshToken = undefined) {
  logger.debug('getToken: called ' + refreshToken)
  const token = btoa(`${process.env.OKTA_CLIENT_ID}:${process.env.OKTA_CLIENT_SECRET}`)
  return request
    .post(`${process.env.OKTA_ISSUER_URL}/v1/token`)
    .set('Authorization', `Basic ${token}`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      refresh_token: refreshToken,
      grant_type: type,
      scope
    })
    .then((response) => {
      logger.debug(`getToken: ${JSON.stringify(response.body)}`)
      return response.body
    })
}

export { initializeOkta }
