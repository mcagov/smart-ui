import createError from 'http-errors';
import request from 'superagent';
import okta from '@okta/okta-sdk-nodejs';
import { logger } from '@mca/common-logger';
import { getEnv, sortName } from '../utils.js';
import { randomUUID } from 'crypto';

const USER_STATUSES = { ACTIVE: 'ACTIVE' };
const defaultRegisterError = 'This email cannot be used, try another'
const TRAINING_PROVIDER_GROUP_NAME = `mcauk-smart-${getEnv()}-training-providers`;
const ADMIN_BODY_GROUP_NAME = `mcauk-smart-${getEnv()}-administrative-body`;
const OKTA_SMART_USER_TYPE_ID = `${process.env.OKTA_SMART_USER_TYPE_ID || 'otyh2ph1hq1MYLxEL357'}`;

class OktaUsers {
  constructor(
    trainingProvider = TRAINING_PROVIDER_GROUP_NAME,
    adminBody = ADMIN_BODY_GROUP_NAME,
    injectedClient = null) {

    this.client = injectedClient || new okta.Client({
      orgUrl: process.env.OKTA_ORG_URL,
      token: process.env.OKTA_ACCESS_API_TOKEN,

    });

    this.userApi = new okta.UserApi(this.client);
    this.groupApi = new okta.GroupApi(this.client);

    if (!trainingProvider || trainingProvider.length === 0) {
      throw createError(400, 'User group name must be set');
    } else if (trainingProvider && trainingProvider.includes('registrars')) {
      throw createError(400, `Illegal group ${trainingProvider} being used`);
    }

    this.trainingProviderGroup = trainingProvider;
    this.adminBody = adminBody;
  }

  async _users(collection) {
    const found = [];
    try {
      for await (const user of collection) {
        found.push({
          id: user.id,
          status: user.status,
          lastLogin: user.lastLogin,
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            email: user.profile.email,
            primaryPhone: user.profile.primaryPhone,
            // Map other fields as necessary
          }
        });
      }
      return found.sort(sortName);
    } catch (err) {
      logger.error('Error iterating users collection', err);
      throw err;
    }
  }


  async all() {
    return this._users(this.userApi.listUsers());
  }

  async create(user) {
    if (user) {
      if (!user.type && OKTA_SMART_USER_TYPE_ID) {
        user.type = { id: OKTA_SMART_USER_TYPE_ID };
      }
    }

    const payload = {
      body: user,
      activate: false
    };

    return this.userApi.createUser(payload);
  }

  async update(id, updated) {
    const user = await this.userApi.getUser(id);

    user.profile.firstName = updated.firstName;
    user.profile.lastName = updated.lastName;
    user.profile.primaryPhone = updated.primaryPhone;

    // TODO: Uncomment if needed
    // user.profile.email = updated.email;
    // user.profile.login = updated.email;
    // user.profile.trainingProviderId = updated.id;
    return this.userApi.updateUser(id, { body: user });
  }

  async deactivateOrDeleteUser(id) {
    try {
      await this.userApi.deactivateUser(id);
    } catch (err) {
      if (err.status !== 404 && err.status !== 400) {
        logger.warn(`Deactivate failed for ${id}, attempting delete anyway`, err);
      }
    }
    return this.userApi.deleteUser(id);
  }

  activate(id) {
    return this.userApi.activateUser(id, { sendEmail: true });
  }

  async reactivate(id) {
    let user;
    try {
      user = await this.userApi.getUser(id);
      logSuccess('reactivate__get_user', user);
    } catch (err) {
      const log = getLog('reactivate__get_user', 'FAILED');
      log.message = err.message;
      log.error = { message: err.message, status: err.status, errorCauses: err.errorCauses };
      logger.error(log.action, log);
      return;
    }

    if (user && user.status === 'PROVISIONED') {
      try {
        await this.userApi.reactivateUser(id, { sendEmail: true });
        logSuccess('reactivate__reactivate_user', 'SUCCESS');
      } catch (err) {
        const log = getLog('reactivate__reactivate_user', user);
        log.message = err.message;
        log.error = { message: err.message, status: err.status, errorCauses: err.errorCauses };
        log.userId = user.id;
        logger.error(log.action, log);
      }
    }

    return user;
  }

  async register(user) {
    let group;
    try {
      group = await this.getTrainingProviderGroup();
    } catch (err) {
      const log = getLog('register__get_signup_group', 'ERROR');
      log.group = this.trainingProviderGroup;
      log.message = err.message;
      log.error = { message: err.message, status: err.status, errorCauses: err.errorCauses };
      logger.error(log.action, log);
      throw createError(500, 'There is a problem with the sign up service, please try later');
    }

    let created;
    try {
      user.groupIds = [group.id];
      created = await this.create(user);
      logSuccess('register__create_user', created);
    } catch (err) {
      const msg = getSignupError(err);
      logError('register__create_user', err, msg);
      throw createError(400, msg);
    }

    try {
      await this.activate(created.id);
      logSuccess('register__activate_user', created);
    } catch (err) {
      logError('register__activate_user', err, undefined, created);
      throw createError(400, `${defaultRegisterError}`);
    }
    return created;
  }

  authn(credentials) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn')
      .send(credentials)
      .then((data) => {
        logSuccess('/api/v1/authn', data.body.status);
        return data.body;
      })
      .catch((err) => {
        logWarn('/api/v1/authn', err);
        throw err;
      });
  }

  resetPwAuthn(credentials) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn/recovery/token')
      .send(credentials)
      .then((data) => {
        logSuccess('/api/v1/authn/recovery/token', data.body.status);
        return data.body;
      })
      .catch((err) => {
        logWarn('/api/v1/authn/recovery/token', err);
        throw err;
      });
  }


  async getBrands() {
    const url = `${process.env.OKTA_ORG_URL}/api/v1/brands`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_ACCESS_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  }

  unlock(id) {
    return this.userApi.unlockUser(id);
  }

  resetPassword(credentials) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn/credentials/reset_password')
      .send(credentials)
      .then((data) => {
        logSuccess('/api/v1/authn/credentials/reset_password');
        return data;
      })
      .catch((err) => {
        logWarn('/api/v1/authn/credentials/reset_password', err);
        throw err;
      });
  }

  changePassword(credentials) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn/credentials/change_password')
      .send(credentials)
      .then((data) => {
        logSuccess('/api/v1/authn/credentials/change_password');
        return data;
      })
      .catch((err) => {
        logWarn('/api/v1/authn/credentials/change_password', err);
        throw err;
      });
  }

  forgotPassword(account) {
    return request
      .post(process.env.OKTA_ORG_URL + '/api/v1/authn/recovery/password')
      .send(account)
      .then((data) => {
        logSuccess('/api/v1/authn/recovery/password');
        return data;
      })
      .catch((err) => {
        logWarn('/api/v1/authn/recovery/password', err);
        throw err;
      });
  }

  adminResetPassword(id) {
    return this.userApi.resetPassword(id, { sendEmail: true });
  }

  getAll(ids) {
    const search = `id eq "${ids.join('" or id eq "')}"`;
    return this._users(this.userApi.listUsers({ search }));
  }

  async getGroup(name) {
    const groups = await this.groupApi.listGroups({ q: name });
    let found;

    for await (const group of groups) {
      found = group;
      break;
    }

    if (found) {
      return found;
    } else {
      logger.warn(`Group not found: ${name}`);
      throw createError(404, `Group ${name} not found`);
    }
  }

  getAdminBodyGroup() {
    return this.getGroup(this.adminBody);
  }

  async getTrainingProviderGroup() {
    const group = await this.getGroup(this.trainingProviderGroup);
    if (!group || (group.profile.name && group.profile.name.includes('admin'))) {
      logger.error(`Illegal group being used: ${group.profile.name} `);
      throw createError(400, `Illegal group ${group.profile.name} being used`);
    }
    return group;
  }

  getUsersByTrainingProviderId(id) {
    return this._users(this.userApi.listUsers({
      search: `profile.trainingProviderId eq "${id}"`
    }));
  }

  async getAdminBodyUsers() {
    const group = await this.getAdminBodyGroup();
    return this._users(this.groupApi.listGroupUsers(group.id));
  }

  async getGroupsForUser(user) {
    const userId = user.id;
    const groupsCollection = await this.userApi.listUserGroups(userId);
    const groups = [];
    for await (const g of groupsCollection) {
      groups.push(g);
    }
    return groups;
  }

  async get(id) {
    try {
      return await this.userApi.getUser(id);
    } catch (err) {
      logger.warn(err);
      if (err.status === 404) {
        throw createError(404, `User ${id} not found - have they signed up?`);
      }
      throw err;
    }
  }

  async getActiveUser(id) {
    const user = await this.get(id);
    if (user.status !== USER_STATUSES.ACTIVE) {
      logger.warn(`User account has not been activated: ${id}`);
      throw createError(403, `User ${id} has not been activated - check with the user`);
    } else {
      const groups = await this.getGroupsForUser(user);
      const group = groups.find((g) => g.profile.name === this.trainingProviderGroup);
      if (group) {
        return user;
      } else {
        logger.warn(`User account has not assigned to group: ${id} - ${this.trainingProviderGroup}`);
        throw createError(403, `User ${id} does not have access to SMarT - check with the user`);
      }
    }
  }

  getRedirectUrl(sessionToken) {
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
      '&state=' + randomUUID();
  }

  getADRedirectUrl() {
    return process.env.OKTA_ORG_URL +
      '/oauth2/v1/authorize' +
      '?idp=' + process.env.OKTA_AZURE_IDP +
      '&client_id=' + process.env.OKTA_CLIENT_ID +
      '&response_mode=fragment' +
      '&response_type=code' +
      '&redirect_uri=' + process.env.OKTA_REDIRECT_URI +
      '&scope=' + process.env.OKTA_SCOPE +
      '&nonce=' + randomUUID() +
      '&state=' + randomUUID();
  }
}

function getSignupError (err) {
  if (isUserConflictError(err)) {
    return 'A user with this email already exists, try another';
  } else if (isPasswordError(err)) {
    return err.errorCauses[0].errorSummary.substring(10);
  } else {
    return 'Registration failed';
  }
}

function isUserConflictError (err) {
  return hasError(err, 'An object with this field already exists in the current organization');
}

function isPasswordError (err) {
  return hasError(err, 'password:');
}

function hasError (err, msg) {
  return (err &&
    Array.isArray(err.errorCauses) &&
    err.errorCauses.findIndex((e) => e.errorSummary && e.errorSummary.includes(msg)) > -1);
}

function getLog (action, status) {
  return { action, status };
}

function logSuccess (action, user) {
  const log = getLog(action, 'SUCCESS');
  if (user) {
    if (typeof user === 'string') {
      log.status = user;
    } else {
      log.userId = user.id;
    }
  }
  logger.info(log.action, log);
}

function logError (action, err, msg, user) {
  const log = getLog(action, 'FAILED');
  log.error = {
    status: err.status,
    message: err.message,
    errorCauses: err.errorCauses
  };
  if (msg) {
    log.msg = msg;
  }
  if (user) {
    log.userId = user.id;
  }
  logger.error(log.action, log);
}

function logWarn (action, err) {
  const log = getLog(action, 'FAILED');
  log.message = err.message;
  log.error = { status: err.status };
  if (err.response && err.response.body) {
    log.error.errorCode = err.response.body.errorCode;
    log.error.errorSummary = err.response.body.errorSummary;
    log.error.errorId = err.response.body.errorId;
    log.error.errorLink = err.response.body.errorLink;
  }
  logger.warn(log.message || action, log);
}

export default OktaUsers;
export { getSignupError };
