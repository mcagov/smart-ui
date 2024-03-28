import request from 'supertest'
import { app } from '../../src/app.js'

function randomCompanyNumber () {
  const max = 99999999
  const min = 100000
  return (Math.round(Math.random() * (max - min) + min)).toString()
}

describe('/training-providers', function () {
  const trainingProviderId = 'f1198f11-8122-4182-bfaa-8c4ef5512d34'
  let newTrainingProviderId = ''

  // Admin only
  it('should load list of training provider', function () {
    return request(app)
      .get('/training-providers')
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Training providers')
      })
  })

  it('should load training provider page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Bond-Gibbons')
      })
  })

  it('should load company detail page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/details`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Training provider details')
      })
  })

  it('should load company address page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/address`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Address')
      })
  })

  it('should load company representative page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/representative`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Representatives')
      })
  })

  it('should load company banking page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/banking`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Banking details')
      })
  })

  it('should load training provider summary page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/summary`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Summary')
      })
  })

  it.skip('should create a blank training provider', function () {
    return request(app)
      .get('/training-providers/create')
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(302)
      .then(data => {
        newTrainingProviderId = data.text.split('/')[2]
      })
  })

  it.skip('should not allow non-unique company numbers', function () {
    const data = {
      'company-name': 'test 232',
      'company-number': '55095990',
      'phone-number': '12345678901',
      'provider-type': 'Company'
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/details`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(400)
  })

  it.skip('should add company details to training provider', function () {
    const data = {
      'company-name': 'test 232',
      'company-number': randomCompanyNumber(),
      'phone-number': '12345678901',
      'provider-type': 'Company'
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/details`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should not add blank company details to training provider', function () {
    const data = {
      'company-name': '',
      'company-number': '',
      'phone-number': '',
      'fax-number': '',
      'company-type': ''
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/details`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(400)
  })

  it.skip('should add representative details to the training provider', function () {
    const data = {
      representative: 'Company owner',
      'liaison-officer': 'Officer name 1',
      'training-officer': 'Officer name 2'
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/representative`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should not add blank representative details to the training provider', function () {
    const data = {}
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/representative`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(400)
  })

  it.skip('should add address details to the training provider', function () {
    const data = {
      'address-line-1': 'address 1',
      'address-line-2': 'address 2',
      'address-town': 'town',
      'address-postcode': 'postocde'
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/address`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should not add blank address details to the training provider', function () {
    const data = {
      'address-line-1': '',
      'address-line-2': '',
      'address-town': '',
      'address-postcode': ''
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/address`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(400)
  })

  it.skip('should add banking details to the training provider', function () {
    const data = {
      'sort-code': '123456',
      'account-number': '12345678'
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/banking`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should not add blank banking details to the training provider', function () {
    const data = {
      'sort-code': '',
      'account-number': ''
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/banking`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(400)
  })

  it.skip('should update training provider state', function () {
    return request(app)
      .get(`/training-providers/${newTrainingProviderId}/status/Active`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(302)
  })

  it.skip('should not add an client company', function () {
    const data = {
      'client-company-name': '',
      'client-company-number': ''
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/new-client-company`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(400)
  })

  it.skip('should add an client company', function () {
    const data = {
      'client-company-name': 'Ocean explorers ltd',
      'client-company-number': randomCompanyNumber()
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/new-client-company`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should add an existing client company', function () {
    const data = {
      'client-company': '43087fc8-a373-4203-bc5f-95d4bfd139f7'
    }
    return request(app)
      .post(`/training-providers/${newTrainingProviderId}/client-companies`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should remove a client company', function () {
    return request(app)
      .get(`/training-providers/${newTrainingProviderId}/client-company/43087fc8-a373-4203-bc5f-95d4bfd139f7/remove`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(302)
  })
})
