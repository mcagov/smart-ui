import request from 'supertest'
import { app } from '../../src/app.js'

describe('/api', function () {
  const trainingProviderId = '52f7aa35-886c-4b01-ad31-f4169d316f6c'
  it('should search for trainees', function () {
    return request(app)
      .get(`/api/trainees/autocomplete?trainingProviderId=${trainingProviderId}&contactName=Cox`)
      .set('SMART-USER', 'mca.tp1@service.dev.smart.mcga.uk')
      .expect(200).then(results => {
        const trainee = results.body
        expect(trainee).toContainEqual(expect.objectContaining({ suggestion: 'Denis Cox' }))
      })
  })
})
