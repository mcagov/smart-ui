import dotenv from 'dotenv'
import OktaUsers from '../../src/services/okta.users.js'
import { logger } from '@mca/common-logger'; //useful to keep for debugging
import { afterAll, beforeAll } from '@jest/globals'

dotenv.config()

const TRAINING_PROVIDER_GROUP_NAME = `mcauk-smart-dev-training-providers`
const ADMIN_BODY_GROUP_NAME = `mcauk-smart-dev-administrative-body`

const userService = new OktaUsers(TRAINING_PROVIDER_GROUP_NAME, ADMIN_BODY_GROUP_NAME)

const PROVIDER_ID = 'f1198f11-8122-4182-bfaa-8c4ef5512d34'

const USERS = {
  MCA_BOT: {
    id: '00uczt7c8jK0HeBmU0x7',
    email: 'info@mcatestbot.com',
    firstName: 'DO NOT DELETE',
    lastName: 'USED FOR TESTS'
  },
  MCA_REGISTRAR: {
    id: '00uczxkf0txw7LAL50x7',
    email: 'mcauk-registrar@smarttest.com'
  },
  NOT_ACTIVE: {
    id: '00uczxlkrmGfSjo2j0x7',
    email: 'notactive@smarttest.com'
  },
  INVALID: {
    email: 'invalid@test.mcatestbot.com'
  }
}

const credentials = {
  password: {
    value: 'ChangeMe123'
  }
}

const MCA_TEST_BOT = {
  profile: {
    firstName: 'DO NOT DELETE',
    lastName: 'USED FOR TESTS',
    email: 'info@mcatestbot.com',
    login: 'info@mcatestbot.com'
  },
  credentials: credentials,
  groupIds: ['00gczrhr9vGXogPof0x7']
}

const user1 = {
  profile: {
    firstName: 'XXX eddie',
    lastName: 'Test',
    email: 'info@eddiemt.com',
    login: 'info@eddiemt.com'
  },
  credentials: credentials,
  groupIds: ['00gczrhr9vGXogPof0x7']
}

const user2 = {
  profile: {
    firstName: 'Test SMarT',
    lastName: 'TP User',
    email: 'smart-tp1-test@catapult.cx',
    login: 'smart-tp1-test@catapult.cx',
    primaryPhone: '01234 321654',
    trainingProviderId: PROVIDER_ID
  }
}

const userToActivate = {
  profile: {
    firstName: 'Test',
    lastName: 'Activate',
    email: 'test-activate@eddiemt.com',
    login: 'test-activate@eddiemt.com'
  }
};

async function teardownUser (id) {
  try {
    const user = await userService.get(id)
    if (user) {
      await userService.deactivateOrDeleteUser(user.id)
      await userService.deactivateOrDeleteUser(user.id)
    }
  } catch (err) {
    console.log(err)
  }
}

describe.skip('OktaUsers', () => {
  beforeAll(async () => {
    await teardownUser(user1.profile.login)
    await teardownUser(user2.profile.login)
    await teardownUser(userToActivate.profile.login)
  })
  afterAll(async () => {
    await teardownUser(user1.profile.login)
    await teardownUser(user2.profile.login)
    await teardownUser(userToActivate.profile.login)
  })

  describe('get brands', () => {
    it('should list brands', async () => {
      const listBrands =  await userService.getBrands()
        listBrands.each((brand) => {
          expect(brand.id).toBeDefined()
          expect(brand.name).toBeDefined()
          expect(brand.isDefault).toBeDefined()
        })
    })
  })

  describe('#getAll by id', () => {
    it('should get all users', async() => {
      // Last ID does not exist
      return await userService.getAll(['00u4btu0mujMX9HaN0x7', '00u4btvjciwyWK0TL0x7', '00u1sag5e9TPGH0pT357'])
        .then((users) => {
          expect(users.length).toBe(2)
        })
    })
  })
  describe('#create', () => {
    it('should create a user', async() => {
      return await userService.create(user1)
        .then((item) => {
          expect(item.profile.email).toBe("info@eddiemt.com")
        })
    })
  })
  describe('#activate', () => {
    it('should activate a staged user', async() => {
      const createdUser = await userService.create(userToActivate, false);
      await userService.activate(createdUser.id);
      const newUser = await userService.userApi.getUser({ userId: createdUser.id });
      expect(newUser).toBeDefined();
      expect(newUser.status).toBe('PROVISIONED');
    });
  });
  describe('#resetPassword', () => {
    it('should reset a password for user', () => {
      return userService.adminResetPassword(USERS.NOT_ACTIVE.id)
        .then((item) => {
          expect(item).toBeDefined()
        })
    })
  })
  describe('#register and update', () => {
    describe('#register', () => {
      it('should register a training provider user', () => {
        return userService.register(user2)
          .then((item) => {
            expect(item.id).toBeDefined()
            expect(item.status).toBe('STAGED')
            expect(item.profile.firstName).toBe(user2.profile.firstName)
            expect(item.profile.lastName).toBe(user2.profile.lastName)
            expect(item.profile.login).toBe(user2.profile.login)
            expect(item.profile.email).toBe(user2.profile.email)
            expect(item.profile.primaryPhone).toBe(user2.profile.primaryPhone)
            expect(item.profile.trainingProviderId).toBe(user2.profile.trainingProviderId)
          })
      })
    })
    describe('#update', () => {
      it('should update a registered user', () => {
        const updated = {
          firstName: 'Updated SMarT',
          lastName: 'Training Provider',
          email: 'smart-tp66@catapult.cx',
          login: 'smart-tp66@catapult.cx',
          primaryPhone: '01234 2222222',
          trainingProviderId: PROVIDER_ID
        }
        return userService.update(user2.profile.email, updated)
          .then((item) => {
            expect(item.id).toBeDefined()
            expect(item.status).toBe('PROVISIONED')
            expect(item.profile.firstName).toBe(updated.firstName)
            expect(item.profile.lastName).toBe(updated.lastName)
            expect(item.profile.login).toBe(user2.profile.login)
            expect(item.profile.email).toBe(user2.profile.email)
            expect(item.profile.primaryPhone).toBe(updated.primaryPhone)
            expect(item.profile.trainingProviderId).toBe(user2.profile.trainingProviderId)
          })
      })
    })
  })
  describe('#all', () => {
    it('should get all users', () => {
      return userService.all()
        .then((users) => {
          expect(users.length).toBeGreaterThan(0)
        })
    })
  })
  describe('#getAdminBodyGroup', () => {
    it('should not get default env registrar group', () => {
      return userService.getAdminBodyGroup()
        .catch((err) => {
          expect(err.name).toEqual('NotFoundError')
        })
    })
    it('should get registrar group', () => {
      return userService.getAdminBodyGroup('mcauk-uksr-preprod-registrars')
        .then((group) => {
          expect(group.id).toBeDefined()
          expect(group.type).toEqual('OKTA_GROUP')
          expect(group.profile.name).toContain('mcauk-smart-dev-administrative-body')
        })
    })
  })
  describe('#getTrainingProviderGroup', () => {
    it('should get user group', () => {
      return userService.getTrainingProviderGroup()
        .then((group) => {
          expect(group.id).toBeDefined()
          expect(group.type).toEqual('OKTA_GROUP')
          expect(group.profile.name).toContain('mcauk-smart-dev-training-providers')
        })
    })
  })
  describe('#getAdminBody', () => {
    it('should get admin body users', () => {
      return userService.getAdminBodyUsers(ADMIN_BODY_GROUP_NAME)
        .then((users) => {
          expect(users.length).toBeGreaterThan(0)
          // expect(users[0].profile.groups.includes(ADMIN_BODY_GROUP_NAME)).toBeTrue()
        })
    })
  })
  describe('#getUsersByTrainingProviderId', () => {
    it('should get users for a training provider', () => {
      return userService.getUsersByTrainingProviderId(PROVIDER_ID)
        .then((users) => {
          expect(users.length).toBeGreaterThan(0)
        })
    })
  })
  describe('#get', () => {
    it('should get user by id', () => {
      return userService.get(USERS.MCA_BOT.id)
        .then((item) => {
          expect(item).toBeDefined()
          expect(item.id).toEqual(USERS.MCA_BOT.id)
          expect(item.profile.email).toEqual(USERS.MCA_BOT.email)
          expect(item.profile.firstName).toEqual(USERS.MCA_BOT.firstName)
          expect(item.profile.lastName).toEqual(USERS.MCA_BOT.lastName)
        })
    })
    it('should get user by email', () => {
      return userService.get(USERS.MCA_BOT.email).then((item) => {
        expect(item).toBeDefined()
        expect(item.id).toEqual(USERS.MCA_BOT.id)
        expect(item.profile.email).toEqual(USERS.MCA_BOT.email)
        expect(item.profile.firstName).toEqual(USERS.MCA_BOT.firstName)
        expect(item.profile.lastName).toEqual(USERS.MCA_BOT.lastName)
      })
    })
  })
  describe('#getActiveUser', () => {
    it('should get user by email', () => {
      return userService
        .getActiveUser(USERS.MCA_BOT.email)
        .then((item) => {
          expect(item).toBeDefined()
          expect(item.id).toEqual(USERS.MCA_BOT.id)
          expect(item.profile.email).toEqual(USERS.MCA_BOT.email)
          expect(item.profile.firstName).toEqual(USERS.MCA_BOT.firstName)
          expect(item.profile.lastName).toEqual(USERS.MCA_BOT.lastName)
        })
    })
    it('should NOT work for invalid account ', () => {
      return userService.getActiveUser(USERS.NOT_ACTIVE.email).catch((err) => {
        expect(err).toBeDefined()
        expect(err.status).toEqual(403)
        expect(err.message).toEqual('User notactive@smarttest.com has not been activated - check with the user')
      })
    })
    it('should NOT work for inactive account ', () => {
      return userService.getActiveUser(USERS.INVALID.email).catch((err) => {
        expect(err).toBeDefined()
        expect(err.status).toEqual(404)
        expect(err.message).toEqual('User invalid@test.mcatestbot.com not found - have they signed up?')
      })
    })
    it('should NOT work for user not in correct group', () => {
      return userService.getActiveUser(USERS.MCA_REGISTRAR.email).catch((err) => {
        expect(err).toBeDefined()
        expect(err.status).toEqual(403)
        expect(err.message).toEqual('User mcauk-registrar@smarttest.com does not have access to SMarT - check with the user')
      })
    })
  })
})
