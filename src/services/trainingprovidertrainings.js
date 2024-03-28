import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class TrainingProviderTrainings extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/trainings')
    super(url)
    logger.info(`TrainingProviderTrainings: created client for url: ${url}`)
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

  allByTrainingId (accessToken, ids, trainingProviderId) {
    return agent.get(this.url)
      .query({ trainingProviderId })
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ ids })
      .then((data) => { return data.body })
  }

  allCovidByTrainingId (accessToken, trainingProviderId) {
    return agent.get(`${this.url}/covid`)
      .query({ trainingProviderId })
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  /**
   * @deprecated
   * @param accessToken
   * @param id
   * @param traineeId
   * @param body
   * @returns {*}
   */
  createTrainee (accessToken, id, traineeId, body) {
    return agent
      .post(`${this.url}/${id}/trainees/${traineeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body)
      .then((data) => { return data.body })
  }

  /**
   * @deprecated
   * @param accessToken
   * @param id
   * @param traineeId
   * @param body
   * @returns {*}
   */
  updateTrainee (accessToken, id, traineeId, body) {
    return agent
      .put(`${this.url}/${id}/trainees/${traineeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body)
      .then((data) => { return data.body })
  }

  /**
   * @deprecated
   * @param accessToken
   * @param id
   * @param traineeId
   * @returns {*}
   */
  deleteTrainee (accessToken, id, traineeId) {
    return agent
      .delete(`${this.url}/${id}/trainees/${traineeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }
}

export default TrainingProviderTrainings
