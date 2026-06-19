import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class TrainingItems extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/training-items')
    super(url)
    logger.info(`TrainingItems: created client for url: ${url}`)
  }

  addSmartItem (accessToken, id, smartItemId) {
    return agent
      .post(`${this.url}/${id}/smart-item/${smartItemId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  delSmartItem (accessToken, id, smartItemId) {
    return agent
      .delete(`${this.url}/${id}/smart-item/${smartItemId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  updateStatus (accessToken, id, status) {
    return agent
      .put(`${this.url}/${id}/status/${status}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }
}

export default TrainingItems
