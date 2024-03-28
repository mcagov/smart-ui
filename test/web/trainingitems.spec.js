import request from 'supertest'
import { app } from '../../src/app.js'

describe.skip('/training-items', function () {
  // Admin only
  it('should load list of training items', function () {
    return request(app)
      .get('/training-items')
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(403)
  })

  // it('should load a training items', function () {
  //   return request(app)
  //     .get('/training-items/349776ed-7faf-42eb-beab-81529e8cd69b')
  //     .set('SMART-USER', 'jim@enterprise.ufp')
  //     .expect(200)
  // })
})
