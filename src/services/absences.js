import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Absences extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/absences')
    super(url)
    logger.info(`Absences: created client for url: ${url}`)
  }
}

export default Absences
