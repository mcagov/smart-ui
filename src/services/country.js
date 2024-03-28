import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Country extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/countries')
    super(url)
    logger.info(`Country: created client for url: ${url}`)
  }

  getAllSmartEligible (accessToken) {
    return agent
      .get(`${this.url}/smart-eligible`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }
}

export default Country
