import request from 'supertest'
import { app } from '../../src/app.js'

describe('/training-providers/:id/trainees', function () {
  const trainingProviderId = '52f7aa35-886c-4b01-ad31-f4169d316f6c'
  let newTraineeId = ''

  it('should load training provider trainee page', function () {
    return request(app).get(`/training-providers/${trainingProviderId}/trainees`)
      .expect(200)
      .set('SMART-USER', 'mca.tp1@service.dev.smart.mcga.uk')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .then(data => {
        expect(data.res.text).toContain('Brian Randall')
      })
  })

  it.skip('should create a new trainee', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/trainees/create`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
      // .then(data => {
      //   newTraineeId = data.text.split('/')[4]
      // })
  })

  it.skip('should update a trainee details', function () {
    const data = {
      'contact-name': 'Sam Smith',
      'seafarer-classification': 'B12',
      nationality: 'UK',
      'place-of-birth': 'London',
      'dob-year': '1990',
      'dob-month': '10',
      'dob-day': '1',
      gender: 'Female',
      ethnicity: 'British',
      'uk-discharge-book-number': ''
    }
    return request(app)
      .post(`/training-providers/${trainingProviderId}/trainees/${newTraineeId}/details`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should not update a trainee address', function () {
    const data = {
      'address-line-1': '',
      'address-line-2': '',
      'address-town': '',
      'address-postcode': ''
    }
    return request(app)
      .post(`/training-providers/${trainingProviderId}/trainees/${newTraineeId}/address`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(400)
  })

  it.skip('should update a trainee address', function () {
    const data = {
      'address-line-1': '1 Orange tree road',
      'address-line-2': 'Deven',
      'address-town': 'Tavistock',
      'address-postcode': 'TD11 4FF'
    }
    return request(app)
      .post(`/training-providers/${trainingProviderId}/trainees/${newTraineeId}/address`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .send(data)
      .expect(302)
  })

  it.skip('should view a new trainee summary', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/trainees/${newTraineeId}/summary`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(200)
  })

  it.skip('should update a new trainee status', function () {
    return request(app)
      .get(`/training-providers/${trainingProviderId}/trainees/${newTraineeId}/status/Active`)
      .set('SMART-USER', 'jim@enterprise.ufp')
      .expect(302)
  })
})
