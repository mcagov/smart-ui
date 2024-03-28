import { logger } from '@mca/common-logger'
import { ClientRequestInterceptor } from '@mswjs/interceptors/lib/interceptors/ClientRequest'

export function setupRequestLogging () {
  logger.warn('Enabling logging of out going requests')

  function _handleHttpRequest (request) {
    const requestEvent = {
      url: request.url.toString(),
      method: request.method,
      headers: request.headers.raw(),
      body: request.body
    }

    logger.info(`\nrequestEvent\n${JSON.stringify(requestEvent)}`)
  }

  function _handleHttpResponse (request, response) {
    const responseEvent = {
      url: request.url.toString(),
      method: request.method,
      body: response.body,
      headers: response.headers.raw(),
      statusCode: response.status
    }

    logger.info(`\nresponseEvent\n${JSON.stringify(responseEvent)}`)
  }

  const interceptor = new ClientRequestInterceptor()

  interceptor.on('request', _handleHttpRequest)
  interceptor.on('response', _handleHttpResponse)

  interceptor.apply()
}
