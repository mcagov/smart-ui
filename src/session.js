import session from 'express-session'
import redis from 'redis'
import connectRedis from 'connect-redis'
import { logger } from '@mca/common-logger'
import config from './config.js'

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
    }

    const redisClient = redis.createClient(redisOptions)

    redisClient.on('error', (err) => logger.error('Redis Client Error', err))

    redisClient.on('connect', function () {
      logger.warn('redis for session connected')
    })

    redisClient.connect().catch((err) => {
      logger.error('Error calling redis connect', err)
      throw err
    })

    app.use(session({
      store: new RedisStore({
        client: redisClient,
        ttl: 86400 // TODO - what should this be ?
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 86400000 } // TODO - what should this be ?
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
