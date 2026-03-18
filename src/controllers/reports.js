import { logger } from '@mca/common-logger'
import { getAccessToken } from '../utils.js'
import config from '../config.js'
import agent from 'superagent'
import urlJoin from 'url-join'

export function getContinuingTraineeReport () {
  return async (req, res, next) => {
    try {
      const { financialYear, financialPeriod, smartCategoryId } = req.body

      if (!financialYear || !financialPeriod || !smartCategoryId) {
        return res.status(400).json({
          error: 'Missing required parameters: financialYear, financialPeriod, and smartCategoryId are required'
        })
      }

      const accessToken = getAccessToken(req)
      const apiUrl = urlJoin(config.endpoints.api, '/v1/reports/continuing-trainee-report')

      logger.info(`Fetching continuing trainee report: ${apiUrl}`, { financialYear, financialPeriod, smartCategoryId })

      const response = await agent
        .put(apiUrl)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ financialYear, financialPeriod, smartCategoryId })

      res.status(response.status).json(response.body)
    } catch (err) {
      logger.error('Error fetching continuing trainee report', err)

      if (err.status === 404) {
        return res.status(404).json({
          error: 'Report not found or API endpoint unavailable'
        })
      }

      if (err.status === 403) {
        return res.status(403).json({
          error: 'Access forbidden - insufficient permissions to generate report',
          details: err.response?.body || err.message
        })
      }

      if (err.status) {
        return res.status(err.status).json({
          error: err.message || 'Error fetching report',
          details: err.response?.body || err.message
        })
      }

      next(err)
    }
  }
}

export function getMonthlyTraineeReportSummary() {
  return async (req, res, next) => {
    const { financialYear, financialPeriod, trainingProviderId } = req.body

    if (!financialYear || !financialPeriod) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'financialYear and financialPeriod are required'
      })
    }

    const accessToken = getAccessToken(req)


    const apiBaseUrl = config.get('endpoints.api')
    const apiUrl = urlJoin(apiBaseUrl, '/v1/reports/monthly-trainee-report')

    const query = {
      financialYear,
      financialPeriod,
      ...(trainingProviderId && { trainingProviderId })
    }

    try {
      logger.info('Fetching monthly trainee report summary', {
        apiUrl,
        query
      })

      const { status, body } = await agent
        .put(apiUrl)
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query)

      return res.status(status).json(body)
    } catch (err) {
      logger.error('Error fetching monthly trainee report summary', {
        message: err.message,
        status: err.status,
        response: err.response?.body
      })

      const status = err.status || 500

      if (status === 404) {
        return res.status(404).json({
          error: 'Report not found or API endpoint unavailable'
        })
      }

      if (status === 403) {
        return res.status(403).json({
          error: 'Access forbidden - insufficient permissions to generate report',
          details: err.response?.body || err.message
        })
      }

      if (err.status) {
        return res.status(status).json({
          error: err.message || 'Error fetching report',
          details: err.response?.body
        })
      }

      return next(err)
    }
  }
}

export function checkReportExists () {
  return async (req, res, next) => {
    try {
      const { reportParams } = req.query
      //TODO: submit req.body as a list of string parameters
      //TODO: pull through the reportType as a request parameter

      const accessToken = getAccessToken(req)
      //TODO: paramterise the reportType
      const reportType = 'continuing-trainees-report'
      const apiUrl = urlJoin(config.endpoints.api, `/v1/reports/${reportType}`)
      const queryParams = new URLSearchParams()
      queryParams.append('reportParams', reportParams) //TODO: use the submitted parameters

      logger.info(`Checking existence of report: ${apiUrl}`, req.body)

      const response = await agent
        .head(`${apiUrl}?${queryParams.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)

      res.status(response.status).json(response.body)
    } catch (err) {
      if (err.status === 404) {
        //TODO: Return a normal response but indicate that the report with the given parameters was not found
        log.info("Report with provided parameters not found")
      }

      log.error("Failed to check existence of the report")

      if (err.status === 403) {
        return res.status(403).json({
          error: 'Access forbidden - insufficient permissions to check report existence',
          details: err.response?.body || err.message
        })
      }

      if (err.status) {
        return res.status(err.status).json({
          error: err.message || 'Error fetching report',
          details: err.response?.body || err.message
        })
      }

      next(err)
    }
  }
}