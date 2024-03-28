import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'
import { isSet } from '../utils.js'

class WorkflowLogs extends WebService {
  constructor() {
    const url = urlJoin(config.endpoints.api, '/v1/workflow_log')
    super(url)
    logger.info(`WorkflowLogs: created client for url: ${url}`)
  }

  allByWorkflow(accessToken, params) {
    return agent
      .get(this.url)
      .set('Authorization', `Bearer ${accessToken}`)
      .query( params )
      .then((data) => {
        return data.body
      })
  }
}

export default WorkflowLogs
