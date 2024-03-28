import { logger } from '@mca/common-logger'
import { hasOwnProperty, isHttps, daysAsMS, getDomain } from './utils.js'

const POLICY_DEFAULT = { usage: 'on' }

const COOKIES = {
  COOKIES_POLICY: 'smart-cookie-preferences',
  GA: '_ga',
  GID: '_gid',
  GAT: '_gat',
  GTAG: `_gat_gtag_${(process.env.GOOGLE_ID ? process.env.GOOGLE_ID.replace('-', '_') : '')}`
}

function getJSONCookie (req, name) {
  const cookie = req.cookies[name]
  if (cookie) {
    try {
      return JSON.parse(cookie)
    } catch (err) {
      logger.error(`ERROR parsing ${name} - make sure the cookie value is valid JSON`, err)
    }
  }
}

function getCookieProperty (cookie, key) {
  if (cookie && hasOwnProperty(cookie, key)) {
    return cookie[key]
  }
}

const _COOKIES = COOKIES
export { _COOKIES as COOKIES }
const _getJSONCookie = getJSONCookie
export { _getJSONCookie as getJSONCookie }
const _getCookieProperty = getCookieProperty
export { _getCookieProperty as getCookieProperty }

function handleCookies (app, csrf) {
  function setGA (res, policy) {
    if (policy.usage !== 'on') {
      const domain = getDomain()
      res.clearCookie(COOKIES.GA, { path: '/', domain })
      res.clearCookie(COOKIES.GAT, { path: '/', domain })
      res.clearCookie(COOKIES.GID, { path: '/', domain })
    }
  }

  function setPolicy (res, policy) {
    res.locals.cookiePolicy = policy
    setGA(res, policy)
    res.cookie(COOKIES.COOKIES_POLICY, JSON.stringify(policy), {
      maxAge: daysAsMS(365),
      httpOnly: false,
      secure: isHttps(),
      encode: v => v // this disables url encoding of the cookie
    })
  }

  app.post('/cookies', csrf, (req, res) => {
    const policy = {}
    Object.keys(POLICY_DEFAULT).forEach((k) => {
      policy[k] = req.body[k] ? req.body[k] : POLICY_DEFAULT[k]
    })
    setPolicy(res, policy)
    res.render('public/cookies', {
      status: policy.usage ? 'accept' : 'reject',
      csrfToken: req.csrfToken()
    })
  })

  app.get('/cookies', csrf, (req, res) => {
    const cookie = getJSONCookie(req, COOKIES.COOKIES_POLICY) || {}
    const policy = {}
    Object.keys(POLICY_DEFAULT).forEach((k) => {
      policy[k] = getCookieProperty(cookie, k) || POLICY_DEFAULT[k]
    })
    res.locals.cookiePolicy = policy
    res.render('public/cookies', {
      status: req.query.status || false,
      csrfToken: req.csrfToken()
    })
  })

  return function handleCookies (req, res, next) {
    res.locals.shouldShowCookieMessage = req.cookies[COOKIES.COOKIES_POLICY] === undefined
    res.locals.cookiePolicy = getJSONCookie(req, COOKIES.COOKIES_POLICY) || POLICY_DEFAULT

    next()
  }
}

export { handleCookies }
