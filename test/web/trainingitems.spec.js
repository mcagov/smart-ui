import request from 'supertest'
import { app } from '../../src/app.js'

describe('/training-items', function () {
  // Admin only
  it('should not load list of training items', function () {
    return request(app)
      .get('/training-items')
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(403)
  })

  it('should load list of training items', function () {
    return request(app)
      .get('/training-items')
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Advanced Fire Fighting (STCW code Table A-VI/3)')
      })

  })

  it('should load a training items', function () {
    return request(app)
      .get('/training-items/26b7a2ea-0932-437c-96c2-e8ab4cce7696')
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(200)
  })
})
