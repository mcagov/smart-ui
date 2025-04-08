import request from 'supertest'
import { app } from '../../src/app.js'

describe('/training-providers/:id/claims', function () {
  const trainingProviderId = 'f1198f11-8122-4182-bfaa-8c4ef5512d34'
  let trainingId = '509b82d7-6a9e-4989-a9d5-26d0e993fbfe'

  it('should view tp claims', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/claims`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
  })

  it('should view financial year page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/claims/years/2022`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
  })

  it('should view claim period page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/claims/years/2022/periods/9`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
  })
})
