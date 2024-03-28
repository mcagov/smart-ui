import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Trainees extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/trainees')
    super(url)
    logger.info(`Trainees: created client for url: ${url}`)
  }

  search (accessToken, params) {
    return agent
      .get(`${this.url}/search`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  updateStatus (accessToken, id, status) {
    return agent
      .put(`${this.url}/${id}/status/${status}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  duplicates (accessToken, params) {
    return agent
      .get(`${this.url}/duplicates`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  transferring (accessToken, params) {
    return agent
      .get(`${this.url}/transferring`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  searchForContactName (accessToken, trainingProviderId, contactName, limit = 10) {
    return agent
      .get(`${this.url}/search`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ trainingProviderId })
      .query({ contactName })
      .query({ limit })
      .then((data) => { return data.body })
  }

  // TODO revisit this - security doesn't work
  allByIds (accessToken, params) {
    return agent
      .get(this.url)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  allById (accessToken, trainingProviderId, page, limit) {
    return agent
      .get(this.url)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ trainingProviderId })
      .query({ page })
      .query({ limit })
      .then((data) => { return data.body })
  }

  getByTrainingId (accessToken, params) {
    return agent
      .get(`${this.url}/byTraining`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  transfer (accessToken, id, trainingProviderId) {
    return this.put(accessToken, `${id}/transfer/${trainingProviderId}`)
  }

  getTraineesClaims (accessToken, id, params) {
    return agent
      .get(`${this.url}/${id}/claims`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  getAllClaims (accessToken, id, params) {
    return agent
      .get(`${this.url}/${id}/all-claims`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  getAllForecasts (accessToken, id, params) {
    return agent
      .get(`${this.url}/${id}/all-forecasts`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }
}

export default Trainees
