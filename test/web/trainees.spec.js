import request from 'supertest'
import { app } from '../../src/app.js'

describe('/trainees', function () {
  const traineeName = 'Christine Tucker'
  const traineeId = 'c428469c-3538-4a2d-8f03-29d5614b9494'

  it('should load trainee page for given id', function () {
    return request(app)
      .get(`/trainees/${traineeId}`)
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(200)
      .then(data => {
        expect(data.text).toContain(`${traineeName}`)
      })
  })

  it('should load trainees page and list all trainees', function () {
    return request(app)
      .get('/trainees')
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(200)
      .then(data => {
        expect(data.text).toContain('Trainees')
      })
  })
})
