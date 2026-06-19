import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class SeafarerClassification extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/seafarer-classifications')
    super(url)
    logger.info(`SeafarerClassification: created client for url: ${url}`)
  }
}

export default SeafarerClassification
