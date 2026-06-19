import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Enrolments extends WebService {
  constructor() {
    const url = urlJoin(config.endpoints.api, '/v1/enrolments')
    super(url)
    logger.info(`Enrolments: created client for url: ${url}`)
  }

  getByTrainingId(accessToken, params) {
    return agent
      .get(`${this.url}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  getTrainingDropdown(accessToken, params) {
    return agent
      .get(`${this.url}/training-dropdown`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  adminUpdate(accessToken, id, item) {
    return agent
      .put(this.url + '/' + id + '/adminUpdate')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .send(item)
      .then((data) => {
        return data.body
      })
  }

  updateStatus(accessToken, id, status) {
    return agent
      .put(this.url + '/' + id + '/status/' + status)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .then((data) => {
        return data.body
      })
  }

  reactivate(accessToken, id) {
    return agent
      .post(this.url + '/' + id + '/reactivate')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .then((data) => {
        return data.body
      })
  }

  rejectTransfer(accessToken, id) {
    return agent
      .post(this.url + '/' + id + '/rejectTransfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .then((data) => {
        return data.body
      })
  }
}

export default Enrolments
