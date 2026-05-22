import redis from 'redis'
import { logger } from '@mca/common-logger'
import config from '../config.js'
import fs from 'fs'

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

      if (process.env.REDIS_CA_PATH) {
        try {
          redisOptions.socket.ca = [fs.readFileSync(process.env.REDIS_CA_PATH)]
        } catch (err) {
          logger.warn(`Could not load Redis CA at ${process.env.REDIS_CA_PATH}. Error: ${err.code} - ${err.message}. Relying on local auth fallback.`);        }
      }
      const isLocalDev = process.env.LOCAL_AUTH === 'true' || process.env.JAVA_ENV === 'local';
      if (isLocalDev) {
        logger.warn('Local environment detected: setting rejectUnauthorized = false for Redis Cache TLS')
        redisOptions.socket.rejectUnauthorized = false
      }
    }

    this.redisClient = redis.createClient(redisOptions)

    this.redisClient.on('error', (err) => logger.error('Redis Client Error', err))

    this.redisClient.on('connect', function () {
      logger.info('redis for cache connected securely')
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
