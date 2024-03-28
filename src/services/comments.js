import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Comments extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.comments, '/v2/comments')
    super(url)
    logger.info(`Comments: created client for url: ${url}`)
  }

  resolve (accessToken, id) {
    return agent
      .post(`${this.url}/${id}/resolve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  reply (accessToken, id, item) {
    return agent
      .post(`${this.url}/${id}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(item)
      .then((data) => { return data.body })
  }

  messages (accessToken, id, params) {
    return agent
      .get(`${this.url}/${id}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }
}

export default Comments
