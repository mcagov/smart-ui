import request from 'supertest'
import { app } from '../../src/app.js'

function randomCompanyNumber () {
  const max = 99999999
  const min = 100000
  return (Math.round(Math.random() * (max - min) + min)).toString()
}

// Create/update flows for company, representative, address, banking and status
// are covered by trainingprovider-controller.spec.js as controller-level unit
// tests instead of here (see that file for why).
describe('/training-providers', function () {
  const trainingProviderId = 'f1198f11-8122-4182-bfaa-8c4ef5512d34'

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

  // controllers/providers.js exports updateClientCompanies/removeClientCompanies,
  // but no router mounts new-client-company, client-companies or
  // client-company/:ccid/remove anywhere - these 404 against current code and
  // stay skipped until those routes are actually wired up.
  it.skip('should not add an client company', function () {
    const data = {
      'client-company-name': '',
      'client-company-number': ''
    }
    return request(app)
      .post(`/training-providers/${trainingProviderId}/new-client-company`)
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .send(data)
      .expect(400)
  })

  it.skip('should add an client company', function () {
    const data = {
      'client-company-name': 'Ocean explorers ltd',
      'client-company-number': randomCompanyNumber()
    }
    return request(app)
      .post(`/training-providers/${trainingProviderId}/new-client-company`)
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .send(data)
      .expect(302)
  })

  it.skip('should add an existing client company', function () {
    const data = {
      'client-company': '43087fc8-a373-4203-bc5f-95d4bfd139f7'
    }
    return request(app)
      .post(`/training-providers/${trainingProviderId}/client-companies`)
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .send(data)
      .expect(302)
  })

  it.skip('should remove a client company', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/client-company/43087fc8-a373-4203-bc5f-95d4bfd139f7/remove`)
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(302)
  })
})
