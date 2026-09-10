import request from 'supertest'
import { app } from '../../src/app.js'

// Trainee create/update/status flows are covered by tptrainees-controller.spec.js
describe('/training-providers/:id/trainees', function () {
  const trainingProviderId = '52f7aa35-886c-4b01-ad31-f4169d316f6c'

  it('should load training provider trainee page', function () {
    return request(app).get(`/training-providers/${trainingProviderId}/trainees`)
      .expect(200)
      .set('SMART-USER', 'mca.tp1@service.dev.smart.mcga.uk')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .then(data => {
        expect(data.res.text).toContain('Brian Randall')
      })
  })
})
