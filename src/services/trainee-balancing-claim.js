import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class TraineeBalancingClaims extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/trainee-balancing-claims')
    super(url)
    logger.info(`TraineeBalancingClaims: created client for url: ${url}`)
  }
}

export default TraineeBalancingClaims
