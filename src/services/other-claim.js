import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class OtherClaims extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/other-claims')
    super(url)
    logger.info(`OtherClaims: created client for url: ${url}`)
  }
}

export default OtherClaims
