import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'

class Claims extends WebService {
  constructor() {
    const url = urlJoin(config.endpoints.api, '/v1/claims')
    super(url)
    logger.info(`Claims: created client for url: ${url}`)
  }

  create(accessToken, trainingProvider, year, period) {
    return agent
      .post(`${this._getUrl(trainingProvider, year, period)}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  updateStatus(accessToken, trainingProvider, year, period, status) {
    return agent
      .post(`${this._getUrl(trainingProvider, year, period)}/${status}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  getFinancialYear(accessToken, trainingProvider, year) {
    return (
      agent
        .get(this.url + `/${trainingProvider}/${year}`)
        .set('Authorization', `Bearer ${accessToken}`)
        // .query({ trainingProviderId: trainingProvider })
        .then((data) => {
          return data.body
        })
    )
  }

  getClaimPeriodItems(
    accessToken,
    trainingProvider,
    year,
    period,
    params = {}
  ) {
    return agent
      .get(`${this._getUrl(trainingProvider, year, period)}/trainee-claims`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  getClaimPeriodBalancingItems(
    accessToken,
    trainingProvider,
    year,
    period,
    params = {}
  ) {
    return agent
      .get(
        `${this._getUrl(
          trainingProvider,
          year,
          period
        )}/trainee-balancing-claims`
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  getClaimPeriodOtherItems(
    accessToken,
    trainingProvider,
    year,
    period,
    params = {}
  ) {
    return agent
      .get(`${this._getUrl(trainingProvider, year, period)}/other-claims`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  getClaimPeriodByTpId(accessToken, trainingProvider, year, period) {
    return (
      agent
        .get(`${this._getUrl(trainingProvider, year, period)}`)
        .set('Authorization', `Bearer ${accessToken}`)
        // .query({ trainingProviderId: trainingProvider })
        .then((data) => {
          return data.body
        })
    )
  }

  getTraineesWithClaims(accessToken, trainingProvider) {
    return agent
      .get(`${this.url}/${trainingProvider}/trainees-with-claims`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  getBcTraineesDropDown(accessToken, trainingProvider) {
    return agent
      .get(`${this.url}/${trainingProvider}/bc-trainees-drop-down`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  getBcTrainingDropDown(accessToken, trainingProvider) {
    return agent
      .get(`${this.url}/${trainingProvider}/bc-training-drop-down`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  getTraineeClaims(accessToken, trainingProvider, trainee) {
    return agent
      .get(`${this.url}/${trainingProvider}/trainee-claims/${trainee}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => {
        return data.body
      })
  }

  getClaimSiSummaryItems(
    accessToken,
    trainingProvider,
    year,
    period,
    params = {}
  ) {
    return agent
      .get(`${this._getUrl(trainingProvider, year, period)}/si-summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => {
        return data.body
      })
  }

  _getUrl(trainingProvider, year, period) {
    return this.url + `/${trainingProvider}/${year}/${period}`
  }
}

export default Claims
