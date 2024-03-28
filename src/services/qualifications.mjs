import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Qualifications extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/qualifications')
    super(url)
    logger.info(`Qualifications: created client for url: ${url}`)
  }
}

export default Qualifications
