import request from 'supertest'
import { app } from '../../src/app.js'

// Training creation is covered by tptraining-controller.spec.js as a
// controller-level unit test instead of here (see that file for why).
describe('/training-providers/:id/trainings', () => {
  const trainingProviderId = 'f1198f11-8122-4182-bfaa-8c4ef5512d34'
  const trainingId = '6f3579fc-79ce-4323-acea-66b48720281d'

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
    expect(response.text).toContain('training')
    expect(response.text).toContain('1-50 IF Instalments (Foundation Degree)')

  })
})
