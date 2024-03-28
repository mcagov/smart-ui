import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Levels extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/levels')
    super(url)
    logger.info(`Levels: created client for url: ${url}`)
  }
}

export default Levels
