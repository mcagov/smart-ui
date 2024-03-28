function hasSession (session) {
  return session && session.passport && session.passport.user
}

function getSessionUser (req) {
  if (hasSession(req.session)) {
    return req.session.passport.user.userinfo
  } else if (req.session &&
    req.session[`oidc:${process.env.OKTA_ISSUER_URL}`] &&
    req.session[`oidc:${process.env.OKTA_ISSUER_URL}`].user) {
    return req.session[`oidc:${process.env.OKTA_ISSUER_URL}`].user
  }
}

export {
  getSessionUser
}
