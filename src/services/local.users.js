import { logger } from '@mca/common-logger'
const users = [
  {
    id: '00uicwex5zQFIiC6f301',
    status: 'ACTIVE',
    lastLogin: '',
    groups: ['mcauk-smart-dev-administrative-body', 'mcauk-smart-dev-super-admin'],
    profile: {
      firstName: 'mca',
      lastName: 'ab',
      email: 'mca.ab@service.dev.smart.mcga.uk',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f302',
    status: 'ACTIVE',
    lastLogin: '',
    trainingProviderId: 'f1198f11-8122-4182-bfaa-8c4ef5512d34',
    groups: ['mcauk-smart-dev-training-providers'],
    profile: {
      firstName: 'James',
      lastName: 'Kirk',
      email: 'jim@enterprise.ufp',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f303',
    status: 'ACTIVE',
    lastLogin: '',
    trainingProviderId: '52f7aa35-886c-4b01-ad31-f4169d316f6c',
    groups: ['mcauk-smart-dev-training-providers'],
    profile: {
      firstName: 'mca',
      lastName: 'tp1',
      email: 'mca.tp1@service.dev.smart.mcga.uk',
      primaryPhone: '01234 554321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f304',
    status: 'ACTIVE',
    lastLogin: '',
    trainingProviderId: 'f1198f11-8122-4182-bfaa-8c4ef5512d34',
    groups: ['mcauk-smart-dev-training-providers'],
    profile: {
      firstName: 'mca',
      lastName: 'tp2',
      email: 'mca.tp2@service.dev.smart.mcga.uk',
      primaryPhone: '01234 554321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f305',
    status: 'ACTIVE',
    lastLogin: '',
    groups: ['mcauk-smart-dev-administrative-body'],
    profile: {
      firstName: 'Craig',
      lastName: 'Cook',
      email: 'craig.cook@catapult.cx',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f306',
    trainingProviderId: 'f1198f11-8122-4182-bfaa-8c4ef5512d34',
    status: 'STAGED',
    lastLogin: '',
    groups: ['mcauk-smart-dev-training-providers'],
    profile: {
      firstName: 'Travis',
      lastName: 'Perkins',
      email: 'sstg@service.dev.smart.mcga.uk',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f307',
    trainingProviderId: 'e3137171-5b89-4c17-978b-153e8d0cce38',
    status: 'STAGED',
    lastLogin: '',
    groups: ['mcauk-smart-dev-training-providers'],
    profile: {
      firstName: 'Tony',
      lastName: 'Pecker',
      email: 'tp2@test.catapult.cx',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f308',
    status: 'ACTIVE',
    lastLogin: '',
    groups: ['mcauk-smart-dev-administrative-body'],
    profile: {
      firstName: 'Jack',
      lastName: 'Bauer',
      email: 'jack@test.catapult.cx',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f309',
    status: 'ACTIVE',
    lastLogin: '',
    groups: ['mcauk-smart-dev-administrative-body'],
    profile: {
      firstName: 'Luke',
      lastName: 'Skywalker',
      email: 'luke@the.force',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f310',
    status: 'ACTIVE',
    lastLogin: '',
    groups: ['mcauk-smart-dev-administrative-body'],
    profile: {
      firstName: 'Anakin',
      lastName: 'Skywalker',
      email: 'vader@the.empire',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f311',
    status: 'ACTIVE',
    lastLogin: '',
    groups: ['mcauk-smart-dev-administrative-body'],
    profile: {
      firstName: 'Jack',
      lastName: 'Reacher',
      email: 'reacher@test.catapult.cx',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f312',
    status: 'ACTIVE',
    lastLogin: '',
    groups: ['mcauk-smart-dev-administrative-body'],
    profile: {
      firstName: 'Clark',
      lastName: 'Kent',
      email: 'ck@daily.planet',
      primaryPhone: '01234 654321'
    }
  },
  {
    id: '00uicwex5zQFIiC6f313',
    trainingProviderId: '8c0f2042-dd5d-473a-b692-a5bd047493ca',
    status: 'STAGED',
    lastLogin: '',
    groups: ['mcauk-smart-dev-training-providers'],
    profile: {
      firstName: 'Peter',
      lastName: 'Smith',
      email: 'tom@test.catapult.cx',
      primaryPhone: '01234 654321'
    }
  }, {
    id: '00uicwex5zQFIiC6f314',
    status: 'ACTIVE',
    lastLogin: '',
    trainingProviderId: '35b66bcc-e78c-4c8e-84d2-40f83cd49d59',
    groups: ['mcauk-smart-dev-training-providers'],
    profile: {
      firstName: 'mca',
      lastName: 'tp3',
      email: 'mca.tp3@service.dev.smart.mcga.uk',
      primaryPhone: '01234 554323'
    }
  },
  {
    id: '00uicwex5zQFIiC6f315',
    status: 'ACTIVE',
    lastLogin: '',
    groups: ['mcauk-smart-dev-report-user'],
    profile: {
      firstName: 'Report',
      lastName: 'User',
      email: 'mca.ru@service.dev.smart.mcga.uk',
      primaryPhone: '01234 654321'
    }
  }
]
const spareIds = [
  '8ba2596d-7f1f-48f5-a39a-218ce0bd910d',
  '19e88d41-b42e-40e5-8dbf-1f40237056cf',
  '55574752-4616-470c-a9d8-40327d95b968',
  'dd1ec277-3520-4a32-814d-ea85474d1e7f',
  '47d8fd49-5cb8-406a-b35e-e5f5078fc4fd',
  '0ebfaad2-3f28-4029-a6c9-d5a24a352ff2',
  '08c2e80c-8977-45a1-be9d-17465040bce2',
  '2a4dee03-66a8-4ad4-9e73-7970eb7404df']

class LocalUsers {
  async get (id) {
    return users.find((u) => u.id === id || (u.profile && u.profile.email === id))
  }

  async getAll (ids) {
    return users.filter((u) => ids.includes(u.id))
  }

  async authn (credentials) {
    const user = await this.get(credentials.username)
    logger.debug(`local authn: credentials\n${JSON.stringify(credentials, null, 2)}`)
    logger.debug(`local authn: user\n${JSON.stringify(user, null, 2)}`)
    user.sessionToken = user.id
    return user
  }

  async register (user) {
    user.groups = ['mcauk-smart-dev-training-providers']
    users.push(user)
    return user
  }

  async update (id, updated) {
    const user = await this.get(id)
    user.profile.firstName = updated.firstName
    user.profile.lastName = updated.lastName
    user.profile.primaryPhone = updated.primaryPhone
    return user
  }

  async getUsersByTrainingProviderId (id) {
    return users.filter((u) => u.trainingProviderId === id)
  }

  getRedirectUrl (sessionToken) {
    return `/authorization-code/callback?sessionToken=${sessionToken}`
  }

  getADRedirectUrl (sessionToken) {
    return `/authorization-code/callback?sessionToken=${sessionToken}`
  }
}

export default LocalUsers
