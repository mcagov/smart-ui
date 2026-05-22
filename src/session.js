import session from 'express-session'
import redis from 'redis'
import connectRedis from 'connect-redis'
import { logger } from '@mca/common-logger'
import config from './config.js'
import fs from 'fs'

export function initialiseSession (app) {
  if (config.features.redis) {
    logger.info(`ENABLE_REDIS is true - adding Redis (${config.redis.host}:${config.redis.port}) as a store for sessions`)

    const RedisStore = connectRedis(session)
    const redisOptions = {
      password: config.redis.password,
      legacyMode: true,
      socket: {
        port: config.redis.port,
        host: config.redis.host
      }
    }

    if (config.redis.tls) {
      logger.info('REDIS_TLS is true - enabling tls for redis session')
      redisOptions.socket.tls = true

      if (process.env.REDIS_CA_PATH) {
        try {
          redisOptions.socket.ca = [fs.readFileSync(process.env.REDIS_CA_PATH)]
        } catch (err) {
          logger.warn(`Could not load Redis CA at ${process.env.REDIS_CA_PATH}. Error: ${err.code} - ${err.message}. Relying on local auth fallback.`);        }
      }
      const isLocalDev = process.env.LOCAL_AUTH === 'true' || process.env.JAVA_ENV === 'local';
      if (isLocalDev) {
        logger.warn('Local environment detected: setting rejectUnauthorized = false for Redis Session TLS')
        redisOptions.socket.rejectUnauthorized = false
      }
    }

    const redisClient = redis.createClient(redisOptions)

    redisClient.on('error', (err) => logger.error('Redis Client Error', err))

    redisClient.on('connect', function () {
      logger.info('redis for session connected securely')
    })

    redisClient.connect().catch((err) => {
      logger.error('Error calling redis connect', err)
      throw err
    })

    app.use(session({
      store: new RedisStore({
        client: redisClient,
        ttl: 86400
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 86400000 }
    }))

    return redisClient
  } else {
    logger.info('ENABLE_REDIS is false - sessions are in memory only')
    app.use(session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false
    }))
  }
}
