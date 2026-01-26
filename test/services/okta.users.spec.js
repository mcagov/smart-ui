import dotenv from 'dotenv'
import OktaUsers from '../../src/services/okta.users.js'

dotenv.config()

const TRAINING_PROVIDER_GROUP_NAME = `mcauk-smart-dev-training-providers`
const ADMIN_BODY_GROUP_NAME = `mcauk-smart-dev-administrative-body`

const userService = new OktaUsers(TRAINING_PROVIDER_GROUP_NAME, ADMIN_BODY_GROUP_NAME)

const PROVIDER_ID = '8c0f2042-dd5d-473a-b692-a5bd047493ca'

const USERS = {
  MCA_BOT: {
    id: '00uh1w6stqbnrP2QB357',
    email: 'mcauk@catapult.cx',
    firstName: 'DO NOT DELETE',
    lastName: 'USED FOR TESTS'
  },
  MCA_REGISTRAR: {
    id: '00u239aoipWKgaVjo357',
    email: 'mcauk-registrar@catapult.cx'
  },
  NOT_ACTIVE: {
    id: '00u4o5p1kzsM1AiXe357',
    email: 'notactive@test.catapult.cx'
  },
  INVALID: {
    email: 'invalid@test.catapult.cx'
  }
}

const credentials = {
  password: {
    value: 'ChangeMe123'
  }
}

const user1 = {
  profile: {
    firstName: 'XXX Craig',
    lastName: 'Test',
    email: 'info@craigjas.com',
    login: 'info@craigjas.com'
  },
  credentials: credentials,
  groupIds: ['00g6esb7nxYLJTNeO357']
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
    await teardownUser(user2.profile.login)
  })
  afterAll(async () => {
    await teardownUser(user2.profile.login)
  })

  describe('get brands', () => {
    it('should list brands', () => {
      userService
        .getBrands()
        .each((brand) => {
          console.log(brand)
        })
      .then((data)=>{
        console.log(data)
      })

      console.log(data.brands)
    })
  })

  describe('#getAll by id', () => {
    it('should get all users', () => {
      // First ID does not exist
      return userService.getAll(['00u2ir2hmqvBvx9Jm357', '00u42xkf7oqeVJ6ow357', '00u1sag5e9TPGH0pT357'])
        .then((users) => {
          expect(users.length).toBe(2)
        })
    })
  })
  describe.skip('#create', () => {
    it('should create a user', () => {
      return userService.create(user1)
        .then((item) => {
          expect(item.length).toBeDefined()
        })
    })
  })
  describe.skip('#activate', () => {
    it('should activate a staged user', () => {
      return userService.activate('00u7r84k5qpwDXA5D357')
        .then((item) => {
          expect(item).toBeDefined()
        })
    })
  })
  describe.skip('#resetPassword', () => {
    it('should reset a password for user', () => {
      return userService.adminResetPassword('00u7r84k5qpwDXA5D357')
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
    it.skip('should not get default env registrar group', () => {
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
    it.skip('should get user by email', () => {
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
    it.skip('should NOT work for invalid account ', () => {
      return userService.getActiveUser(USERS.NOT_ACTIVE.email).catch((err) => {
        expect(err).toBeDefined()
        expect(err.status).toEqual(403)
        expect(err.message).toEqual('User notactive@test.catapult.cx has not been activated - check with the user')
      })
    })
    it('should NOT work for inactive account ', () => {
      return userService.getActiveUser(USERS.INVALID.email).catch((err) => {
        expect(err).toBeDefined()
        expect(err.status).toEqual(404)
        expect(err.message).toEqual('User invalid@test.catapult.cx not found - have they signed up?')
      })
    })
    it('should NOT work for user not in correct group', () => {
      return userService.getActiveUser(USERS.MCA_REGISTRAR.email).catch((err) => {
        expect(err).toBeDefined()
        expect(err.status).toEqual(403)
        expect(err.message).toEqual('User mcauk-registrar@catapult.cx does not have access to SMarT - check with the user')
      })
    })
  })
})
