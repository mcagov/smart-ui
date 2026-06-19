import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class TrainingProviders extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/training-providers')
    super(url)
    logger.info(`TrainingProviders: created client for url: ${url}`)
  }

  getNames (accessToken, ids) {
    return agent
      .get(this.url + '/names')
      .set('Authorization', `Bearer ${accessToken}`)
      .query(ids.map(v => 'id=' + v).join('&'))
      .then((data) => { return data.body })
  }
}

export default TrainingProviders
