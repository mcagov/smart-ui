import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Attachments extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.attachments, '/v1/attachments')
    super(url)
    logger.info(`Attachments: created client for url: ${url}`)
  }
}

export default Attachments
