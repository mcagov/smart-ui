import { logger } from '@mca/common-logger'
import { getAccessToken } from '../utils.js'
import config from '../config.js'
import agent from 'superagent'
import urlJoin from 'url-join'

export function getContinuingTraineeReport() {
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

export function getFailuresReport() {
  return async (req, res, next) => {
    try {
      const { financialYear, financialPeriod } = req.body

      if (!financialYear || !financialPeriod) {
        return res.status(400).json({
          error: 'Missing required parameters: financialYear and financialPeriod are required'
        })
      }

      const accessToken = getAccessToken(req)
      const apiUrl = urlJoin(config.endpoints.api, '/v1/reports/failures-report')

      logger.info(`Fetching failures report: ${apiUrl}`, { financialYear, financialPeriod })

      const response = await agent
        .put(apiUrl)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ financialYear, financialPeriod })

      res.status(response.status).json(response.body)
    } catch (err) {
      logger.error('Error fetching failures report', err)

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

export function downloadReport () {
  return async (req, res, next) => {
    try {
      const { reportParams } = req.query
      const reportType = req.params.reportType

      if (!reportType) {
        return res.status(400).json({
          error: 'Missing required parameter: reportType is required'
        })
      }

      if (!reportParams) {
        return res.status(400).json({
          error: 'Missing required parameter: reportParams is required'
        })
      }

      const accessToken = getAccessToken(req)
      const apiUrl = urlJoin(config.endpoints.api, `/v1/reports/${reportType}/download`)

      logger.info(`Getting presigned URL for ${reportType}: ${apiUrl}`, { reportParams })

      // Build query string with multiple reportParams values
      // Backend expects: ?reportParams=2024&reportParams=2&reportParams=abc123
      const queryParams = new URLSearchParams()
      queryParams.append('reportParams', reportParams)

      const response = await agent
        .get(`${apiUrl}?${queryParams.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)

      // Backend returns a presigned URL string
      const presignedUrl = response.text

      if (!presignedUrl) {
        return res.status(500).json({
          error: 'No presigned URL returned from backend'
        })
      }

      logger.info('Successfully retrieved presigned URL for report download')
      res.status(200).json({ presignedUrl })
    } catch (err) {
      logger.error(`Error getting presigned URL for ${req.query.reportType || 'report'}`, err)

      if (err.status === 404) {
        return res.status(404).json({
          error: 'Report not found. Please generate the report first.'
        })
      }

      if (err.status === 403) {
        return res.status(403).json({
          error: 'Access forbidden - insufficient permissions to download report',
          details: err.response?.body || err.message
        })
      }

      if (err.status) {
        return res.status(err.status).json({
          error: err.message || 'Error getting download URL',
          details: err.response?.body || err.message
        })
      }

      next(err)
    }
  }
}

export function getMonthlyTraineeReportSummary() {
  return async (req, res, next) => {
    const { financialYear, financialPeriod } = req.body

    if (!financialYear || !financialPeriod) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'financialYear and financialPeriod are required'
      })
    }

    const accessToken = getAccessToken(req)

    const apiBaseUrl = config.endpoints.api
    const apiUrl = urlJoin(apiBaseUrl, '/v1/reports/monthly-trainee-report')

    const query = {
      financialYear,
      financialPeriod
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

export function checkReportExists() {
  return async (req, res, next) => {
    try {
      const { reportParams } = req.query

      const accessToken = getAccessToken(req)
      const apiUrl = urlJoin(config.endpoints.api, `/v1/reports/${req.params.reportType}`)
      const queryParams = new URLSearchParams()
      queryParams.append('reportParams', reportParams)

      logger.info(`Checking existence of report: ${apiUrl}`, req.body)

      const response = await agent
        .head(`${apiUrl}?${queryParams.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)

      res.status(response.status).json(response.body)
    } catch (err) {
      if (err.status === 404) {
        logger.info("Report with provided parameters not found")
        return res.status(404).json({
          error: 'Not found - report with parameters not found',
          details: err.response?.body || err.message
        })
      }

      logger.error("Failed to check existence of the report")

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

export function getInvoiceReport () {
  return async (req, res, next) => {
    try {
      const { financialYear, financialPeriod, trainingProviderId } = req.body

      if (!financialYear || !financialPeriod) {
        return res.status(400).json({
          error: 'Missing required parameters: financialYear and financialPeriod are required'
        })
      }

      const accessToken = getAccessToken(req)
      const apiUrl = urlJoin(config.endpoints.api, '/v1/reports/invoice-report')

      logger.info(`Generating invoice report: ${apiUrl}`, { financialYear, financialPeriod, trainingProviderId })

      const query = {
        financialYear,
        financialPeriod,
        ...(trainingProviderId && { trainingProviderId })
      }

      const response = await agent
        .put(apiUrl)
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query)

      // Backend returns the presigned URL as plain text
      const presignedUrl = response.text

      res.status(response.status).send(presignedUrl)
    } catch (err) {
      logger.error('Error generating invoice report', err)

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
          error: err.message || 'Error generating report',
          details: err.response?.body || err.message
        })
      }

      next(err)
    }
  }
}
