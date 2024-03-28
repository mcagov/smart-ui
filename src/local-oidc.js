import { logger } from '@mca/common-logger'
import LocalUsers from './services/local.users.js'
import config from './config.js'
import nJwt from 'njwt'
import { setUserContext } from './controllers/common.js'
import { contains, isBlank } from './utils.js'
const service = new LocalUsers()

function createSession (req, user) {
  user.tokens = {}

  const scp = /^mcauk-smart-\w*-administrative-body$/.test(user.groups[0]) ? process.env.OKTA_SCOPE_AB : process.env.OKTA_SCOPE_TP
  logger.debug(`user ${JSON.stringify(user)}`)
  const claims = {
    iss: config.okta.issuerUrl,
    aud: config.okta.aud,
    sub: user.email,
    uid: user.id,
    scp: scp.split(' '),
    localAuth: 'true',
    trainingProviderId: user.trainingProviderId,
    name: user.profile.firstName + ' ' + user.profile.lastName,
    groups: user.groups

  }

  const jwt = nJwt.create(claims, process.env.LOCAL_AUTH_JWT_KEY)
  jwt.setExpiration(new Date().getTime() + (60 * 60 * 1000 * 8))

  req.session = Object.assign(req.session || {}, {
    passport: {
      user: {
        userinfo: {
          sub: user.id,
          name: user.profile.firstName + ' ' + user.profile.lastName,
          locale: 'UK',
          preferred_username: user.profile.email,
          given_name: user.profile.firstName,
          family_name: user.profile.lastName,
          trainingProviderId: user.trainingProviderId,
          groups: user.groups
        },
        tokens: {
          access_token: jwt.compact()
        }
      }
    }
  })
}

export function initializeLocal (app) {
  const oidc = {
    middleware: async (req, res, next) => {
      if (req.originalUrl.startsWith('/public') || req.originalUrl.startsWith('/assets')) {
        return next()
      }
      let userName = ''
      if (process.env.SMART_USER) {
        userName = process.env.SMART_USER
      } else if (req.headers['smart-user']) {
        userName = req.headers['smart-user']
      } else if (req?.query?.user) {
        userName = req.query.user
      }

      if (userName) {
        const userinfo = await service.get(userName)
        if (userinfo) {
          createSession(req, userinfo)
        }
      }
      if (req.headers['smart-anon']) {
        req.session.passport = undefined
      }
      next()
    },
    logout: (req, res, next) => {
      req.session.passport = undefined
      res.redirect('/signin')
    },
    checkAuth: (req, res, next) => {
      if (req.session.passport) {
        next()
      } else {
        res.redirect('/signin')
      }
    },
    ensureAuthenticated: (req, res, next) => {
      return oidc.checkAuth.bind(null)
    },
    refreshTokenIfRequired: (req, res, next) => {
      logger.warn('refreshTokenIfRequired: called in local auth, but not implemented')
    },
    forceLogoutAndRevoke: (req, res, next) => {
      return oidc.logout.bind(null)
    },
    on: (status, next) => {
      next()
    }
  }
  app.get('/login', (req, res) => {
    res.send('<form novalidate="novalidate" method="GET" action="/" id="form1">\n' +
      '  <input type="text" name="username" id="okta-signin-username">\n' +
      '  <input type="text" name="username" id="okta-signin-password">\n' +
      '  <input type="text" name="username" id="okta-signin-password">\n' +
      '  <input type="submit" id="okta-signin-submit">\n' +
      '  </form>')
  })

  app.use('/logout', (req, res, next) => {
    req.session.passport = undefined
    res.redirect('/')
  })

  app.get('/authorization-code/callback', async (req, res) => {
    const userinfo = await service.get(req.query.sessionToken)
    if (userinfo) {
      createSession(req, userinfo)
      res.redirect('/signin/callback')
    } else {
      res.redirect('/signin')
    }
  })

  app.get('/signin/callback', setUserContext, (req, res, next) => {
    const returnTo = req?.session?.returnTo
    if (isBlank(returnTo) || contains(returnTo, '/callback') || contains(returnTo, '/signin')) {
      logger.debug('in /signin/callback - redirecting to /')
      res.redirect('/')
    } else {
      logger.debug(`in /signin/callback - redirecting to ${returnTo}}`)
      res.redirect(returnTo)
    }
  })

  app.use(oidc.middleware)
  return oidc
}

export function logoutLocal (req, res) {

}

export function ensureAuthenticatedLocal (oidc) {
  return (req, res, next) => {
    if (req.session.passport) {
      next()
    } else {
      res.redirect('/signin')
    }
  }
}
