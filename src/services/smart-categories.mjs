import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class SmartCategories extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/smart-categories')
    super(url)
    logger.info(`SmartCategories: created client for url: ${url}`)
  }
}

export default SmartCategories
