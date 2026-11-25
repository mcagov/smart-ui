import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'
import { isSet } from '../utils.js'

class Forecasts extends WebService {
  constructor() {
    const url = urlJoin(config.endpoints.api, '/v1/forecasts')
    super(url)
    logger.info(`Forecasts: created client for url: ${url}`)
  }

  create(accessToken, forecastType, trainingProvider, year, period) {
    logger.info(
      `Forecasts: create ${forecastType} forecast called for ${trainingProvider} - ${year}/${period}`
    )
    return agent
      .post(`${this._getUrl(forecastType, trainingProvider, year, period)}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  schedule(accessToken, forecastType, trainingProvider, year, period) {
    logger.info(
      `Forecasts: schedule ${forecastType} forecast called for ${trainingProvider} - ${year}/${period}`
    )
    const url = isSet(period)
      ? this.urlFor('schedule', forecastType, trainingProvider, year, period)
      : this.urlFor('schedule', forecastType, trainingProvider, year)
    return agent
      .post(url)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  updateStatus(
    accessToken,
    forecastType,
    trainingProvider,
    year,
    period,
    status
  ) {
    // period = 0 means update the full
    return agent
      .post(this._getUrl(forecastType, trainingProvider, year, period, status))
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  getAvailableYears(accessToken, forecastType, trainingProvider, year) {
    if (forecastType) {
      return agent
        .get(this.urlFor(forecastType, trainingProvider, 'availableYears'))
        .set('Authorization', `Bearer ${accessToken}`)
        .then((data) => {
          return data.body
        })
    } else {
      return agent
        .get(this.urlFor(trainingProvider, 'availableYears'))
        .set('Authorization', `Bearer ${accessToken}`)
        .then((data) => {
          return data.body
        })
    }
  }

  getSummary(accessToken, params) {
    return agent
      .get(this.url + '/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  getFinancialYear(accessToken, forecastType, trainingProvider, year) {
    return agent
      .get(`${this._getUrl(forecastType, trainingProvider, year)}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  getForecastAdjustmentsYear(
    accessToken,
    forecastType,
    trainingProvider,
    year
  ) {
    return agent
      .get(`${this._getUrl(forecastType, trainingProvider, year)}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  getPeriodSummaryItems(
    accessToken,
    forecastType,
    trainingProvider,
    year,
    period,
    params = {}
  ) {
    return agent
      .get(this.urlFor('items-summary', forecastType, trainingProvider, year, period))
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  getPeriodItems(
    accessToken,
    forecastType,
    trainingProvider,
    year,
    period,
    params = {}
  ) {
    return agent
      .get(
        `${this._getUrl(
          forecastType,
          trainingProvider,
          year,
          period
        )}/trainee-forecasts`
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  getPeriodByTpId(accessToken, forecastType, trainingProvider, year, period) {
    return agent
      .get(`${this._getUrl(forecastType, trainingProvider, year, period)}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  _getUrl(forecastType, trainingProvider, year, period, ...suffix) {
    if (isSet(period)) {
      return this.urlFor(forecastType, trainingProvider, year, period, ...suffix)
    } else {
      return this.urlFor(forecastType, trainingProvider, year, ...suffix)
    }
  }
}

export default Forecasts
