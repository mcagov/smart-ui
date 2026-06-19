import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class ForecastAdjustments extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/forecast-adjustments')
    super(url)
    logger.info(`ForecastAdjustments: created client for url: ${url}`)
  }

  get (accessToken, trainingProvider, year, period, trainingId) {
    return agent
      .get(`${this.url}/${trainingProvider}/${year}/${period}/${trainingId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  getByYear (accessToken, trainingProvider, year, params) {
    return agent
      .get(`${this.url}/${trainingProvider}/${year}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  put (accessToken, trainingProvider, year, period, trainingId, traineeCount) {
    return agent
      .put(`${this.url}/${trainingProvider}/${year}/${period}/${trainingId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .query({ traineeCount })
      .send()
      .then((data) => { return data.body })
  }

  del (accessToken, trainingProvider, year, period, trainingId) {
    return agent
      .delete(`${this.url}/${trainingProvider}/${year}/${period}/${trainingId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }
}

export default ForecastAdjustments
