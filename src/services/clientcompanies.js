import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class ClientCompanies extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/client-companies')
    super(url)
    logger.info(`ClientCompanies: created client for url: ${url}`)
  }

  allById (accessToken, trainingProviderId) {
    return agent
      .get(this.url)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ trainingProviderId })
      .then((data) => { return data.body })
  }

  linkTrainingProvider (accessToken, clientId, trainingProviderId) {
    return agent
      .put(`${this.url}/${clientId}/training-provider/${trainingProviderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  removeTrainingProvider (accessToken, clientId, trainingProviderId) {
    return agent
      .delete(`${this.url}/${clientId}/training-provider/${trainingProviderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }
}

export default ClientCompanies
