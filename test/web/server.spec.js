import request from 'supertest'
import { app } from '../../src/app.js'

describe('/', function () {
  it('should load homepage', function () {
    return request(app)
      .get('/')
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Welcome James Kirk to MCA SMarT')
      })
  })

  it('should not load signup', function () {
    return request(app)
      .get('/signup')
      .expect(404)
      .catch(err => {
        expect(data.text).toContain('Page not implemented yet')
      })
  })
})
