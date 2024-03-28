import createError from 'http-errors'
import request from 'superagent'
import okta from '@okta/okta-sdk-nodejs'
import MemoryStore from '@okta/okta-sdk-nodejs/src/memory-store.js'
import { logger } from '@mca/common-logger'
import { getEnv, sortName } from '../utils.js'
import { randomUUID } from 'crypto'

const USER_STATUSES = { ACTIVE: 'ACTIVE' }
const defaultRegisterError = 'This email cannot be used, try another'
const TRAINING_PROVIDER_GROUP_NAME = `mcauk-smart-${getEnv()}-training-providers`
const ADMIN_BODY_GROUP_NAME = `mcauk-smart-${getEnv()}-administrative-body`
const OKTA_SMART_USER_TYPE_ID = `${process.env.OKTA_SMART_USER_TYPE_ID || 'otyh2ph1hq1MYLxEL357'}`

/**
 *
 https://developer.okta.com/okta-sdk-nodejs/jsdocs/
 https://developer.okta.com/docs/reference/api/users/#activate-user
 https://developer.okta.com/docs/reference/api/authn/
 https://github.com/okta/okta-auth-js#node-js-and-react-native-usage
 https://github.com/okta/okta-auth-js/blob/master/docs/authn.md
 *
 */
class OktaUsers {
  constructor (trainingProvider = TRAINING_PROVIDER_GROUP_NAME, adminBody = ADMIN_BODY_GROUP_NAME) {
    this.client = new okta.Client({
      orgUrl: process.env.OKTA_ORG_URL,
      token: process.env.OKTA_ACCESS_API_TOKEN,
      cacheStore: new MemoryStore({ keyLimit: 100000, expirationPoll: true })
    })
    if (!trainingProvider || trainingProvider.length === 0) {
      throw createError(400, 'User group name must be set')
    } else if (trainingProvider && trainingProvider.includes('registrars')) {
      throw createError(400, `Illegal group ${trainingProvider} being used`)
    }
    this.trainingProviderGroup = trainingProvider
    this.adminBody = adminBody
  }

  all () {
    return this._users(this.client.listUsers())
  }

  _users (users) {
    const found = []
    return users
      .each((user) => {
        found.push({
          id: user.id,
          status: user.status,
          lastLogin: user.lastLogin,
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            email: user.profile.email,
            primaryPhone: user.profile.primaryPhone,
          }
        })
      })
      .then(() => { return found.sort(sortName) })
  }

  create (user) {
    if (user) {
      user.type = { id: OKTA_SMART_USER_TYPE_ID }
    }
    return this.client.createUser(user, { activate: false })
  }

  async update (id, updated) {
    const user = await this.get(id)
    user.profile.firstName = updated.firstName
    user.profile.lastName = updated.lastName
    user.profile.primaryPhone = updated.primaryPhone

    // TODO set these via other function
    // user.profile.email = updated.email,
    // user.profile.login = updated.email,
    // user.profile.trainingProviderId = updated.id

    await user.update()
    return user
  }

  deactivateOrDeleteUser (id) {
    return this.client.deactivateOrDeleteUser(id)
  }

  activate (id) {
    return this.client.activateUser(id, { sendEmail: true })
  }

  async reactivate (id) {
    let user
    try {
      user = await this.get(id)
      logSuccess('reactivate__get_user', user)
    } catch (err) {
      const log = getLog('reactivate__get_user', 'FAILED')
      log.message = err.message
      log.error = {
        message: err.message,
        status: err.status,
        errorCauses: err.errorCauses
      }
      logger.error(log.action, log)
    }

    if (user && user.status === 'PROVISIONED') {
      try {
        await this.client.reactivateUser(id, { sendEmail: true })
        logSuccess('reactivate__reactivate_user', 'SUCCESS')
      } catch (err) {
        const log = getLog('reactivate__reactivate_user', user)
        log.message = err.message
        log.error = {
          message: err.message,
          status: err.status,
          errorCauses: err.errorCauses
        }
        log.userId = user.id
        logger.error(log.action, log)
      }
    }
    return user
  }

  async register (user) {
    // https://id.mca.dev.catapult.cx/api/v1/registration/reg1deay2vmv1MpBU357/register
    // Nesting then/catch is a pain for sending the correct error message
    let group
    try {
      group = await this.getTrainingProviderGroup()
    } catch (err) {
      const log = getLog('register__get_signup_group', 'ERROR')
      log.group = this.trainingProviderGroup
      log.message = err.message
      log.error = {
        message: err.message,
        status: err.status,
        errorCauses: err.errorCauses
      }
      logger.error(log.action, log)
      throw createError(500, 'There is a problem with the sign up service, please try later')
    }

    let created
    try {
      user.groupIds = [group.id]
      created = await this.create(user)
      logSuccess('register__create_user', created)
    } catch (err) {
      const msg = getSignupError(err)
      logError('register__create_user', err, msg)
      throw createError(400, msg)
    }

    try {
      // Returns empty by default
      await this.activate(created.id)
      logSuccess('register__activate_user', created)
    } catch (err) {
      logError('register__activate_user', err, undefined, created)
      throw createError(400, 'This email cannot be used, try another')
    }
    return created
  }

  authn (credentials) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn')
      .send(credentials)
      .then((data) => {
        logSuccess('/api/v1/authn', data.body.status)
        return data.body
      })
      .catch((err) => {
        logWarn('/api/v1/authn', err)
        throw err
      })
  }

  resetPwAuthn (credentials) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn/recovery/token')
      .send(credentials)
      .then((data) => {
        logSuccess('/api/v1/authn/recovery/token', data.body.status)
        return data.body
      })
      .catch((err) => {
        logWarn('/api/v1/authn/recovery/token', err)
        throw err
      })
  }

  getBrands() {
    return this.client.listBrands()
  }

  unlock (id) {
    return this.client.unlockUser(id)
  }

  resetPassword (credentials) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn/credentials/reset_password')
      .send(credentials)
      .then((data) => {
        logSuccess('/api/v1/authn/credentials/reset_password')
        return data
      })
      .catch((err) => {
        logWarn('/api/v1/authn/credentials/reset_password', err)
        throw err
      })
  }

  changePassword (credentials) {
    // return this.client.changePassword(id, credentials)
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn/credentials/change_password')
      .send(credentials)
      .then((data) => {
        logSuccess('/api/v1/authn/credentials/change_password')
        return data
      })
      .catch((err) => {
        logWarn('/api/v1/authn/credentials/change_password', err)
        throw err
      })
  }

  forgotPassword (account) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn/recovery/password')
      .send(account)
      .then((data) => {
        logSuccess('/api/v1/authn/recovery/password')
        return data
      })
      .catch((err) => {
        logWarn('/api/v1/authn/recovery/password', err)
        throw err
      })
  }

  adminResetPassword (id) {
    return this.client.resetPassword(id, { sendEmail: true })
  }

  getAll (ids) {
    // filter: `id Eq "${ids.join('" or id Eq "')}"`
    // search: `type.id Eq "${OKTA_SMART_USER_TYPE_ID}" and id Eq "${ids[1]}"`
    // search: `type.id = "${OKTA_SMART_USER_TYPE_ID}" and id Eq "${ids.join('" or id Eq "')}"`
    return this._users(this.client.listUsers({
      search: `id Eq "${ids.join('" or id Eq "')}"`
    }))
  }

  getGroup (name) {
    let found
    return this.client
      .listGroups({ q: name })
      .each((group) => { found = group })
      .then(() => {
        if (found) {
          return found
        } else {
          logger.warn(`Group not found: ${name}`)
          throw createError(404, `Group ${name} not found`)
        }
      })
  }

  getAdminBodyGroup () {
    return this.getGroup(this.adminBody)
  }

  getTrainingProviderGroup () {
    return this.getGroup(this.trainingProviderGroup)
      .then((group) => {
        if (!group || group.profile.name.includes('admin')) {
          logger.error(`Illegal group being used: ${group.profile.name} `)
          throw createError(400, `Illegal group ${group.profile.name} being used`)
        } else {
          return group
        }
      })
  }

  getUsersByTrainingProviderId (id, group = TRAINING_PROVIDER_GROUP_NAME) {
    return this._users(this.client.listUsers({
      search: `profile.trainingProviderId eq "${id}"`
    }))
  }

  getAdminBodyUsers (name = ADMIN_BODY_GROUP_NAME) {
    return this.getAdminBodyGroup(name).then((group) => {
      return this._users(this.client.listGroupUsers(group.id))
    })
  }

  getGroupsForUser (user) {
    const groups = []
    const listGroups = user.listGroups()
    return listGroups
      .each((g) => { groups.push(g) })
      .then(() => { return groups })
  }

  get (id) {
    return this.client
      .getUser(id)
      .catch((err) => {
        logger.warn(err)
        if (err.status === 404) {
          throw createError(404, `User ${id} not found - have they signed up?`)
        } else {
          throw err
        }
      })
  }

  getActiveUser (id) {
    return this.get(id).then(async (user) => {
      if (user.status !== USER_STATUSES.ACTIVE) {
        logger.warn(`User account has not been activated: ${id}`)
        throw createError(403, `User ${id} has not been activated - check with the user`)
      } else {
        const groups = await this.getGroupsForUser(user)
        const group = groups.find((g) => g.profile.name === this.trainingProviderGroup)
        if (group) {
          return user
        } else {
          logger.warn(`User account has not assigned to group: ${id} - ${this.trainingProviderGroup}`)
          throw createError(403, `User ${id} does not have access to SMarT - check with the user`)
        }
      }
    })
  }

  getRedirectUrl (sessionToken) {
    return process.env.OKTA_ISSUER_URL +
      '/v1/authorize?' +
      'client_id=' + process.env.OKTA_CLIENT_ID +
      '&code_challenge=' + randomUUID() +
      '&code_challenge_method=S256' +
      '&display=page' +
      '&sessionToken=' + sessionToken +
      '&response_mode=fragment' +
      '&response_type=code' +
      '&redirect_uri=' + process.env.OKTA_REDIRECT_URI +
      '&scope=' + process.env.OKTA_SCOPE +
      '&nonce=' + randomUUID() +
      '&state=' + randomUUID()
  }

  getADRedirectUrl () {
    return process.env.OKTA_ORG_URL +
      '/oauth2/v1/authorize' +
      '?idp=' + process.env.OKTA_AZURE_IDP +
      '&client_id=' + process.env.OKTA_CLIENT_ID +
      '&response_mode=fragment' +
      '&response_type=code' +
      '&redirect_uri=' + process.env.OKTA_REDIRECT_URI +
      '&scope=' + process.env.OKTA_SCOPE +
      '&nonce=' + randomUUID() +
      '&state=' + randomUUID()
    // '&code_challenge=' + randomUUID() +
    // '&code_challenge_method=S256' +
    // '&display=page' +
    // '&sessionToken=' + sessionToken +
  }
}

function getSignupError (err) {
  if (isUserConflictError(err)) {
    return 'A user with this email already exists, try another'
  } else if (isPasswordError(err)) {
    return err.errorCauses[0].errorSummary.substring(10)
  } else {
    return defaultRegisterError
  }
}

function isUserConflictError (err) {
  return hasError(err, 'An object with this field already exists in the current organization')
}

function isPasswordError (err) {
  return hasError(err, 'password:')
}

function hasError (err, msg) {
  return (err &&
    Array.isArray(err.errorCauses) &&
    err.errorCauses.findIndex((e) => e.errorSummary && e.errorSummary.includes(msg)) > -1)
}

function getLog (action, status) {
  return { action, status }
}

function logSuccess (action, user) {
  const log = getLog(action, 'SUCCESS')
  if (user) {
    log.userId = user.id
  }
  logger.info(log.action, log)
}

function logError (action, err, msg, user) {
  const log = getLog(action, 'FAILED')
  log.error = {
    status: err.status,
    message: err.message,
    errorCauses: err.errorCauses
  }
  if (msg) {
    log.msg = msg
  }
  if (user) {
    log.userId = user.id
  }
  logger.error(log.action, log)
}

function logWarn (action, err) {
  const log = getLog(action, 'FAILED')
  log.message = err.message
  log.error = { status: err.status }
  if (err.response && err.response.body) {
    log.error.errorCode = err.response.body.errorCode
    log.error.errorSummary = err.response.body.errorSummary
    log.error.errorId = err.response.body.errorId
    log.error.errorLink = err.response.body.errorLink
  }
  logger.warn(log.message || action, log)
}

export default OktaUsers

export { getSignupError }
