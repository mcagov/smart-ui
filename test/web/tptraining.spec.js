import request from 'supertest'
import { app } from '../../src/app.js'

describe.skip('/training-providers/:id/trainings', () => {
  const trainingProviderId = 'f1198f11-8122-4182-bfaa-8c4ef5512d34'
  const trainingId = '6f3579fc-79ce-4323-acea-66b48720281d'
  let newTrainingId = ''
  
  it('should load a single training provider training', async () => {
    await request(app)
      .get(`/training-providers/${trainingProviderId}/trainings/${trainingId}`)
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(200)
  })

  it('should load all trainings for a training provider', async () => {
    const response = await request(app)
      .get(`/training-providers/${trainingProviderId}/trainings`)
      .set('SMART-USER', 'mca.ab@service.dev.smart.mcga.uk')
      .expect(200)
      // TODO no point in check the whole html page for a value
    expect(response.text).toContain('Bond-Gibbons')
  })

  it.skip('should training provider creates a trainings', async () => {
    const data = {
      'training-scheme': '8b8b184f-8bfc-4d1f-a057-78c281bb9b7b'
    }
    const response = await request(app)
      .post(`/training-providers/${trainingProviderId}/trainings/create`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
    newTrainingId = response.text.split('/')[4]
  })

  it.skip('should update training provider trainings details', async () => {
    const data = {
      discipline: 'Deck',
      qualification: 'HND',
      'start-date-year': '2022',
      'start-date-month': '4',
      'start-date-day': '20',
      'end-date-year': '2025',
      'end-date-month': '7',
      'end-date-day': '4'
    }
    await request(app)
      .post(`/training-providers/${trainingProviderId}/trainings/${newTrainingId}/details`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should not update training provider trainings details', function () {
    const data = {}
    return request(app)
      .post(`/training-providers/${trainingProviderId}/trainings/${newTrainingId}/details`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(400)
  })
})
