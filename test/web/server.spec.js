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

  it('should show the not found page for an unknown path', function () {
    return request(app)
      .get('/signup')
      .expect(404)
      .then(data => {
        expect(data.text).toContain('Page not found')
        expect(data.text).toContain('SMarT <a href="/"')
      })
  })
})

describe('/robots.txt', function () {
  it('should tell crawlers not to index the site', function () {
    return request(app)
      .get('/robots.txt')
      .expect(200)
      .expect('Content-Type', /text\/plain/)
      .then(data => {
        expect(data.text).toContain('User-agent: *')
        expect(data.text).toContain('Disallow: /')
      })
  })

  it('should be served before the session middleware so no cookie is set', function () {
    return request(app)
      .get('/robots.txt')
      .then(data => {
        expect(data.headers['set-cookie']).toBeUndefined()
      })
  })
})
