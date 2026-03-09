import { logger } from '@mca/common-logger'
import { getAccessToken } from '../utils.js'
import config from '../config.js'
import agent from 'superagent'
import urlJoin from 'url-join'

export function getContinuingTraineeReport () {
  return async (req, res, next) => {
    try {
      const { financialYear, financialPeriod, smartCategoryId } = req.query

      if (!financialYear || !financialPeriod || !smartCategoryId) {
        return res.status(400).json({
          error: 'Missing required parameters: financialYear, financialPeriod, and smartCategoryId are required'
        })
      }

      const accessToken = getAccessToken(req)
      const apiUrl = urlJoin(config.endpoints.api, '/v1/reports/continuing-trainee-report')

      logger.info(`Fetching continuing trainee report: ${apiUrl}`, { financialYear, financialPeriod, smartCategoryId })

      const response = await agent
        .get(apiUrl)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ financialYear, financialPeriod, smartCategoryId })

      res.status(200).json(response.body)
    } catch (err) {
      logger.error('Error fetching continuing trainee report', err)

      if (err.status === 404) {
        return res.status(404).json({
          error: 'Report not found or API endpoint unavailable'
        })
      }

      if (err.status) {
        return res.status(err.status).json({
          error: err.message || 'Error fetching report'
        })
      }

      next(err)
    }
  }
}
