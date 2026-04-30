import createError from 'http-errors';
import request from 'superagent';
import okta from '@okta/okta-sdk-nodejs';
import { logger } from '@mca/common-logger';
import { getEnv, sortName } from '../utils.js';
import { randomUUID } from 'crypto';
import { register } from 'node:module'

const USER_STATUSES = { ACTIVE: 'ACTIVE' };
const defaultRegisterError = 'This email cannot be used, try another'
const TRAINING_PROVIDER_GROUP_NAME = `mcauk-smart-${getEnv()}-training-providers`;
const ADMIN_BODY_GROUP_NAME = `mcauk-smart-${getEnv()}-administrative-body`;
const OKTA_SMART_USER_TYPE_ID = `${process.env.OKTA_SMART_USER_TYPE_ID || 'oty4btqmrfak1KwoK0x7'}`;

class OktaUsers {
  constructor(
    trainingProvider = TRAINING_PROVIDER_GROUP_NAME,
    adminBody = ADMIN_BODY_GROUP_NAME,
    injectedClient = null) {

    this.client = injectedClient || new okta.Client({
      orgUrl: process.env.OKTA_ORG_URL,
      token: process.env.OKTA_ACCESS_API_TOKEN
    });

    this.userApi = this.client.userApi || new okta.UserApi(this.client);
    this.groupApi = this.client.groupApi || new okta.GroupApi(this.client);
    this.customizationApi = this.client.customizationApi

    if (!trainingProvider || trainingProvider.length === 0) {
      throw createError(400, 'User group name must be set');
    } else if (trainingProvider && trainingProvider.includes('registrars')) {
      throw createError(400, `Illegal group ${trainingProvider} being used`);
    }

    this.trainingProviderGroup = trainingProvider;
    this.adminBody = adminBody;
  }

  async _users(collection) {
    const resolvedCollection = await collection;
    if (!resolvedCollection) {
      logger.warn('_users called with null or undefined collection');
      return [];
    }

    const found = [];
    try {
      await resolvedCollection.each(user => {
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
        });
      });
      return found.sort(sortName);
    } catch (err) {
      logger.error('Error iterating users collection', err);
      throw err;
    }
  }


  async all() {
    return this._users(this.userApi.listUsers());
  }

  async create(user, autoActivate = true) {
    if (user) {
        user.type = { id: OKTA_SMART_USER_TYPE_ID };
    }
    return this.userApi.createUser({body: user, activate: autoActivate});
  }

  async update(id, updated) {
    if(!id || !updated) {
      const error = new Error("update user requires a user ID/update data.");
      logger.error(error.message);
      throw error;
    }
    const user = await this.userApi.getUser({userId: id});

    user.profile.firstName = updated.firstName;
    user.profile.lastName = updated.lastName;
    user.profile.primaryPhone = updated.primaryPhone;

    // TODO: Uncomment if needed
    // user.profile.email = updated.email;
    // user.profile.login = updated.email;
    // user.profile.trainingProviderId = updated.trainingProviderId; 
    return this.userApi.updateUser({userId:id,  user:user});
  }

  async deactivateOrDeleteUser(id) {
    if (!id) {
      const error = new Error("deactivateOrDeleteUser requires a valid user ID.");
      logger.error(error.message);
      throw error;
    }
    try {
      await this.userApi.deactivateUser({ userId: id });
      logger.info(`User ${id} deactivated `);
    } catch (err) {
      if (err.status !== 404 && err.status !== 400) {
        logger.warn(`Deactivate failed for ${id}, Status: ${err.status}`, err);
      }
    }
    return this.userApi.deleteUser({ userId: id});
  }

  async activate(id) {
    try {
      const user = await this.userApi.getUser({ userId: id });
      if (user.status === 'PROVISIONED' || user.status === 'ACTIVE') {
        logger.info(`User ${id} is already ${user.status}. Skipping activation.`);
        return user;
      }
      return await this.userApi.activateUser({ userId: id, sendEmail: true });
  } catch (err) {
      logger.info('---ERROR--- ', err.message)
      const log = getLog('activate__get_user', 'FAILED');
      log.message = err.message;
      log.error = { message: err.message, status: err.status, errorCauses: err.errorCauses };
      logger.error(log.action, log);
    }
  }

  async reactivate(id) {
    let user;
    try {
      user = await this.userApi.getUser({userId: id});
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
        await this.userApi.reactivateUser({userId: id, sendEmail: true });
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
      created = await this.create(user, false);
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

  async authn(credentials) {
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

  async resetPwAuthn(credentials) {
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
    return await this.customizationApi.listBrands();
  }

  unlock(id) {
    return this.userApi.unlockUser({ userId:id });
  }

  async resetPassword(credentials) {
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

  async changePassword(credentials) {
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

  async forgotPassword(account) {
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

  async adminResetPassword(id) {
    if (!id) throw new Error("adminResetPassword: Missing user ID");
    try {
      const resetToken = await this.userApi.generateResetPasswordToken({
        userId: id,
        sendEmail: true
      });
      logger.info(`Successfully triggered password reset for ${id}`);
      return resetToken;
    } catch (err) {
      logger.error(`Failed to reset password for ${id}:`, err);
      throw err;
    }
  }

  async getAll(ids) {
    if (!ids || ids.length === 0) return [];
    const search = `id eq "${ids.join('" or id eq "')}"`;
    const collection = await this.userApi.listUsers({ search });
    return this._users(collection);
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
    const collection = await this.groupApi.listGroupUsers({ groupId: group.id });
    return this._users(collection);  }

  async getGroupsForUser(user) {
    const groups = [];
    const groupsCollection = await this.userApi.listUserGroups({userId: user});
    await groupsCollection.each(group => {
      groups.push(group);
    })
    return groups;
  }

  async get(id) {
    try {
      const params = typeof id === 'string' ? { userId: id } : id;
      return await this.userApi.getUser(params);
    } catch (err) {
      logger.warn(err);
      if (err.status === 404) {
        throw createError(404, `User ${id.userId} not found - have they signed up?`);
      }
      throw err;
    }
  }

  async getActiveUser(id) {
    const params = typeof id === 'string' ? { userId: id } : id;
    const actualId = params.userId;
    const user = await this.get(params);
    if (user.status !== USER_STATUSES.ACTIVE) {
      logger.warn(`User account has not been activated: ${actualId}`);
      throw createError(403, `User ${actualId} has not been activated - check with the user`);
    } else {
      const groups = await this.getGroupsForUser(actualId);
      const group = groups.find((grp) => grp.profile.name === this.trainingProviderGroup);
      if (group) {
        return user;
      } else {
        logger.warn(`User account has not assigned to group: ${actualId} - ${this.trainingProviderGroup}`);
        throw createError(403, `User ${actualId} does not have access to SMarT - check with the user`);
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

function getSignupError(err) {
  if (isUserConflictError(err)) {
    return 'A user with this email already exists, try another';
  }
  const PREFIX_LENGTH = 10;
  const summary = err?.errorCauses?.[0]?.errorSummary;
  if (isPasswordError(err) && summary) {
    return summary.length > PREFIX_LENGTH
      ? summary.substring(PREFIX_LENGTH).trim()
      : summary;
  }
  return 'Registration failed';
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

function getDeleteUserError(err) {
  const status = err?.status || err?.response?.status;
  if (status === 404) {
    return 'User could not be found; they may have already been deleted.';
  }
  if (status === 403) {
    return 'You do not have permission to delete this user.';
  }
  return 'An error occurred while trying to remove the user. Please try again.';
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
export { getSignupError, getDeleteUserError };
