import sinon from 'sinon';
import okta from '@okta/okta-sdk-nodejs';
import OktaUsers from '../../src/services/okta.users.js';
import { getEnv } from '../../src/utils.js';


function mockAsyncCollection(items) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const item of items) {
        yield item;
      }
    },
    each: async function (callback) {
      for (const item of items) {
        await callback(item);
      }
    }
  };
}

describe('OktaUsers Service (Unit)', () => {
  let oktaService;

  const mockUser = {
    id: 'u123',
    status: 'ACTIVE',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      login: 'test@example.com'
    }
  };

  const mockGroup = {
    id: 'g123',
    profile: { name: 'Training Provider A' }
  };

  beforeEach(() => {

    sinon.stub(okta.UserApi.prototype, 'listUsers').returns(mockAsyncCollection([mockUser]));
    sinon.stub(okta.UserApi.prototype, 'getUser').resolves({ ...mockUser });
    sinon.stub(okta.UserApi.prototype, 'createUser').resolves(mockUser);
    sinon.stub(okta.UserApi.prototype, 'updateUser').resolves(mockUser);
    sinon.stub(okta.UserApi.prototype, 'deactivateUser').resolves();
    sinon.stub(okta.UserApi.prototype, 'deleteUser').resolves();
    sinon.stub(okta.UserApi.prototype, 'activateUser').resolves();

    sinon.stub(okta.GroupApi.prototype, 'listGroups').returns(mockAsyncCollection([mockGroup]));

    const mockClient = {
     customizationApi: {
        listBrands: sinon.stub().returns(mockAsyncCollection([{ id: 'b1', name: 'Brand A', isDefault: true }]))
      }
    };
    oktaService = new OktaUsers('Training Provider A', 'Admin Body', mockClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Constructor', () => {
    it('should throw if training provider group is missing', () => {
      expect(() => new OktaUsers(null)).toThrow('User group name must be set');
    });

    it('should throw if training provider group contains "registrars"', () => {
      expect(() => new OktaUsers('registrars-group')).toThrow('Illegal group');
    });

    it('should successfully initialize with valid arguments', () => {
      const validGroup = 'Valid Training Provider';
      const validAdmin = 'Valid Admin Body';

      const service = new OktaUsers(validGroup, validAdmin);

      expect(service.trainingProviderGroup).toBe(validGroup);
      expect(service.adminBody).toBe(validAdmin);
    });

    it('should initialize the Okta SDK clients internally', () => {
      const service = new OktaUsers('Valid Group', 'Valid Admin');

      expect(service.client).toBeDefined();
      expect(service.userApi).toBeDefined();
      expect(service.groupApi).toBeDefined();
      expect(service.userApi).toBeInstanceOf(okta.UserApi);
    });

    it('should fallback to environment variables if arguments are not provided', () => {
      const originalEnv = process.env.TRAINING_PROVIDER_GROUP_NAME;
      process.env.TRAINING_PROVIDER_GROUP_NAME = 'Env Var Group';
      try {
        const service = new OktaUsers();
        expect(service.trainingProviderGroup).toBe(`mcauk-smart-${getEnv()}-training-providers`);
      } finally {
        process.env.TRAINING_PROVIDER_GROUP_NAME = originalEnv;
      }
    });
  });

  describe('all()', () => {
    it('should list users and map fields correctly', async () => {
      const result = await oktaService.all();

      expect(okta.UserApi.prototype.listUsers.called).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toEqual('u123');
      expect(result[0].profile.email).toEqual('test@example.com');
    });
  });

  describe('create()', () => {
    it('should structure the request with { body } wrapper', async () => {
      const input = { profile: { email: 'new@test.com' } };

      await oktaService.create(input);

      const callArgs = okta.UserApi.prototype.createUser.getCall(0).args[0];
      expect(callArgs).toBeDefined();
      expect(callArgs.body.profile.email).toEqual('new@test.com');
      // create() defaults to auto-activating when no second argument is passed
      expect(callArgs.activate).toEqual(true);
    });

    it('should not auto-activate when explicitly requested', async () => {
      const input = { profile: { email: 'new@test.com' } };

      await oktaService.create(input, false);

      const callArgs = okta.UserApi.prototype.createUser.getCall(0).args[0];
      expect(callArgs.activate).toEqual(false);
    });
  });

  describe('update()', () => {
    it('should fetch user, update local object, and push update', async () => {
      const updates = {
        firstName: 'UpdatedName',
        lastName: 'UpdatedLast',
        primaryPhone: '000000000'
      };

      const userObj = { ...mockUser, profile: { ...mockUser.profile } };
      okta.UserApi.prototype.getUser.resolves(userObj);

      await oktaService.update('u123', updates);
      expect(okta.UserApi.prototype.getUser.calledWith({ userId: 'u123' })).toBeTruthy();

      const updateArgs = okta.UserApi.prototype.updateUser.getCall(0).args;
      expect(updateArgs[0].userId).toEqual('u123');
      expect(updateArgs[0].user.profile.firstName).toEqual('UpdatedName');
    });
  });

  describe('deactivateAndDeleteUser()', () => {
    it('should attempt deactivate then delete', async () => {
      const user = 'u123'
      await oktaService.deactivateAndDeleteUser(user);

      expect(okta.UserApi.prototype.deactivateUser.calledWith({ userId: 'u123' } )).toBeTruthy();
      expect(okta.UserApi.prototype.deleteUser.calledWith({userId: 'u123'})).toBeTruthy();
    });

    it('should proceed to delete even if deactivate fails with 400/404 (already inactive)', async () => {
      const user = 'u123'
      const error = new Error('Not found');
      error.status = 404;
      okta.UserApi.prototype.deactivateUser.rejects(error);

      await oktaService.deactivateAndDeleteUser(user);

      expect(okta.UserApi.prototype.deleteUser.calledWith({userId: 'u123'})).toBeTruthy();
    });
  });

  describe('register()', () => {
    it('should look up group, create user in that group, and activate', async () => {
      const userInput = { profile: { email: 'reg@test.com' } };
      await oktaService.register(userInput);

      expect(okta.GroupApi.prototype.listGroups.called).toBeTruthy();

      const createArgs = okta.UserApi.prototype.createUser.getCall(0).args[0];
      expect(createArgs.body.groupIds).toContain('g123');

      expect(okta.UserApi.prototype.activateUser).toBeTruthy();
    });

    it('should throw error if group lookup fails', async () => {
      okta.GroupApi.prototype.listGroups.returns(mockAsyncCollection([]));

      try {
        await oktaService.register({ profile: { email: 'fail@test.com' } });
        throw new Error('Should have failed');
      } catch (err) {
        expect(err.message).toContain('problem with the sign up service');
      }
    });
  });


  describe('getBrands()', () => {
    it('should use the Okta SDK customization API to list brands', async () => {
      const brands = await oktaService.getBrands();

      expect(oktaService.customizationApi.listBrands.calledOnce).toBeTruthy();
      expect(brands).toBeDefined();
    });

    it('should propagate an error if the Okta API fails', async () => {
      oktaService.customizationApi.listBrands.throws(new Error('Server Error'));

      await expect(oktaService.getBrands()).rejects.toThrow('Server Error');
    });
  });

  describe('OktaUsers Service - EKS Error Simulation', () => {
    it('should throw the makeRequestContext TypeError when SDK is misconfigured', async () => {
      const eksError = new TypeError("Cannot read properties of undefined (reading 'makeRequestContext')");
      okta.UserApi.prototype.listUsers.throws(eksError);

      try {
        await oktaService.getAll(['u123']);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(TypeError);
        expect(err.message).toContain('makeRequestContext');
      }
    });
  });
});
