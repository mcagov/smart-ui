import request from 'supertest'
import { app } from '../../src/app.js'

describe('/claims', function () {
  it('should view tp claims', function () {
    return request(app)
      .get('/claims')
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(200)
  })
})
