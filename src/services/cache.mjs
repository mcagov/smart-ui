import redis from 'redis'
import { logger } from '@mca/common-logger'
import config from '../config.js'

class Cache {
  constructor (entity) {
    const redisOptions = {
      password: config.redis.password,
      legacyMode: false,
      socket: {
        port: config.redis.port,
        host: config.redis.host
      }
    }

    if (config.redis.tls) {
      logger.info('REDIS_TLS is true - enabling tls for redis cache')
      redisOptions.socket.tls = true
    }

    this.redisClient = redis.createClient(redisOptions)

    this.redisClient.on('error', (err) => logger.error('Redis Client Error', err))

    this.redisClient.on('connect', function () {
      logger.warn('redis for cache connected')
    })

    this.redisClient.connect().catch((err) => {
      logger.error('Error calling redis connect', err)
      throw err
    })

    this.entity = entity
  }

  async get (entity, id) {
    logger.debug(`cache: GET "${entity}::${id}"`)
    const val = await this.redisClient.get(`${entity}::${id}`)
    if (val) {
      logger.debug(`cache: HIT "${entity}::${id}"`)
      return JSON.parse(val)
    } else {
      logger.debug(`cache: MISSED "${entity}::${id}"`)
    }
  }

  async put (entity, id, val, expires = 60 * 60) {
    logger.debug(`cache: PUT "${entity}::${id}"`)
    return await this.redisClient.set(`${entity}::${id}`, JSON.stringify(val), {
      EX: expires,
      NX: false
    })
  }
}

export default Cache
