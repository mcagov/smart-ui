import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class SmartItems extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/smart-items')
    super(url)
    logger.info(`SmartItems: created client for url: ${url}`)
  }

  addRate (accessToken, id, startDate, paymentAmount) {
    return agent
      .post(`${this.url}/${id}/rate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ startDate, paymentAmount })
      .then((data) => { return data.body })
  }
}

export default SmartItems
