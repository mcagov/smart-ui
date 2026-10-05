import agent from 'superagent'
import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

// Overrides (retain) use the WebService defaults: get, create, put and del by trainee id
class TraineeRetention extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/trainee-retention-overrides')
    super(url)
    logger.info(`TraineeRetention: created client for url: ${url}`)
  }

  candidates (accessToken, params = {}) {
    return agent
      .get(`${this.url}/candidates`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  summary (accessToken) {
    return agent
      .get(`${this.url}/candidates/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  getReview (accessToken, traineeId) {
    return agent
      .get(`${this.url}/reviews/${traineeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  createReview (accessToken, review) {
    return agent
      .post(`${this.url}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(review)
      .then((data) => { return data.body })
  }

  deleteReview (accessToken, traineeId) {
    return agent
      .delete(`${this.url}/reviews/${traineeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }
}

export default TraineeRetention
