import config from '../config.js'
import WebService from './webservice.js'
import agent from 'superagent'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'
import { cache } from '../app.js'

class PaymentSchedules extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/payment-schedules')
    super(url)
    logger.info(`PaymentSchedules: created client for url: ${url}`)
  }

  addRate (accessToken, id, startDate, paymentAmount) {
    return agent
      .post(`${this.url}/${id}/rate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ startDate, paymentAmount })
      .then((data) => { return data.body })
  }

  getCurrentFinancialYear (accessToken) {
    return agent
      .get(`${this.url}/current-financial-year`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  getByYear (accessToken, year, params = {}) {
    return agent
      .get(`${this.url}/${year}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  async getByDate (accessToken, date) {
    const data = await cache.get('PaymentSchedules', date)
    if (data) {
      logger.debug(`load getByDate('${date}') from cache`)
      return data
    } else {
      const data = await agent
        .get(`${this.url}/by-date`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ date })
        .then((data) => { return data.body })
      await cache.put('PaymentSchedules', date, data)
      return data
    }
  }

  get (accessToken, year, period) {
    return agent
      .get(`${this.url}/${year}/${period}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  getAvailableYears (accessToken) {
    return agent
      .get(`${this.url}/available-years`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }
}

export default PaymentSchedules
