import agent from 'superagent'
import config from '../config.js'
import WebService from './webservice.js'
import urlJoin from 'url-join'
import { logger } from '@mca/common-logger'
import { cache } from '../app.js'

const SUMMARY_CACHE = 'TraineeRetention'
const SUMMARY_CACHE_ID = 'summary'
const SUMMARY_EXPIRES = 5 * 60

class TraineeRetention extends WebService {
  constructor () {
    const url = urlJoin(config.endpoints.api, '/v1/trainee-retention-overrides')
    super(url)
    logger.info(`TraineeRetention: created client for url: ${url}`)
  }

  candidates (accessToken, params = {}) {
    return agent
      .get(`${this.url}/candidates`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query(params)
      .then((data) => { return data.body })
  }

  async summary (accessToken) {
    try {
      const cached = await cache.get(SUMMARY_CACHE, SUMMARY_CACHE_ID)
      if (cached) {
        return cached
      }
    } catch (err) {
      logger.error('Failed to read the retention summary from the cache', err)
    }
    const data = await agent
      .get(`${this.url}/candidates/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
    try {
      await cache.put(SUMMARY_CACHE, SUMMARY_CACHE_ID, data, SUMMARY_EXPIRES)
    } catch (err) {
      logger.error('Failed to cache the retention summary', err)
    }
    return data
  }

  async clearSummary () {
    try {
      await cache.del(SUMMARY_CACHE, SUMMARY_CACHE_ID)
    } catch (err) {
      logger.error('Failed to clear the cached retention summary', err)
    }
  }

  async create (accessToken, item) {
    const data = await super.create(accessToken, item)
    await this.clearSummary()
    return data
  }

  async put (accessToken, id, item) {
    const data = await super.put(accessToken, id, item)
    await this.clearSummary()
    return data
  }

  async del (accessToken, id) {
    const data = await super.del(accessToken, id)
    await this.clearSummary()
    return data
  }

  getReview (accessToken, traineeId) {
    return agent
      .get(`${this.url}/reviews/${traineeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
  }

  async createReview (accessToken, review) {
    const data = await agent
      .post(`${this.url}/reviews`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(review)
      .then((data) => { return data.body })
    await this.clearSummary()
    return data
  }

  async deleteReview (accessToken, traineeId) {
    const data = await agent
      .delete(`${this.url}/reviews/${traineeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .then((data) => { return data.body })
    await this.clearSummary()
    return data
  }
}

export default TraineeRetention
