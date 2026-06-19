import request from 'supertest'
import { app } from '../../src/app.js'

describe.skip('/training-providers/:id/trainings/:trainingId/absences', function () {
  const trainingProviderId = 'd9a89e1a-16e7-4fcf-9a23-6ea38353463b'
  const trainingId = 'e6de737f-2500-4e4a-a2ad-b1b8fa4f6bf5'
  let newAbsenceId = ''

  // convert to service tests and WDIO tests
  it.skip('should find tp', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
  })

  it.skip('should find training', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/trainings/${trainingId}`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
  })

  it.skip('should Record an unauthorised absence', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/trainings/${trainingId}/absences/create`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(302).then(results => {
        newAbsenceId = results.text.split('/')[6]
      })
  })
  it.skip('should load absence detail page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/trainings/${trainingId}/absences/${newAbsenceId}/details`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
  })
  it.skip('should Update an unauthorised absence', function () {
    const data = {
      'trainee-id': '21752559-9efa-407c-bd8f-e83adeaa294f',
      'start-date-year': '2022',
      'start-date-month': '3',
      'start-date-day': '28',
      'end-date-year': '2022',
      'end-date-month': '3',
      'end-date-day': '30',
      duration: '1.5'
    }
    return request(app)
      .post(`/training-providers/${trainingProviderId}/trainings/${trainingId}/absences/${newAbsenceId}/details`)
      .send(data)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(302)
  })
  it.skip('should load absence summary page', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/trainings/${trainingId}/absences/${newAbsenceId}/summary`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
  })

  it.skip('should complete absence', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/trainings/${trainingId}/absences/${newAbsenceId}/status/Completed`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(302)
  })
})
