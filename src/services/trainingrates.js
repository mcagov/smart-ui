import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class TrainingRates extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/training-rates')
    super(url)
    logger.info(`TrainingRates: created client for url: ${url}`)
  }

  allById (accessToken, trainingItemId) {
    return agent
      .get(this.url + '/getByTrainingItemId')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ trainingItemId })
      .then((data) => { return data.body })
  }
}

export default TrainingRates
