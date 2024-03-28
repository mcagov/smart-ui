import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class ClientCompanies extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/client-companies')
    super(url)
    logger.info(`ClientCompanies: created client for url: ${url}`)
  }
}

export default ClientCompanies
