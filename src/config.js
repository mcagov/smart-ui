import dotenv from 'dotenv'
import convict from 'convict'
dotenv.config()

const NA = 'NA'
const configSchema = {
  env: {
    format: String,
    default: 'dev',
    env: 'NODE_ENV'
  },
  port: {
    format: 'port',
    default: 2997,
    env: 'PORT'
  },
  logLevel: {
    format: String,
    default: 'info',
    env: 'LOGGER_LEVEL'
  },
  defaultScope: {
    format: String,
    default: 'training-providers:read',
    env: 'DEFAULT_SCOPE'
  },
  endpoints: {
    api: {
      doc: 'The smart api endpoint',
      format: String,
      default: NA,
      env: 'SMART_API'
    },
    comments: {
      doc: 'The comments api endpoint',
      format: String,
      default: NA,
      env: 'COMMENTS_API'
    },
    attachments: {
      doc: 'The attachments api endpoint',
      format: String,
      default: NA,
      env: 'ATTACHMENTS_API'
    }
  },
  okta: {
    host: {
      doc: 'The host we are calling the Okta service from',
      format: String,
      default: NA,
      env: 'HOST'
    },
    aud: {
      format: String,
      default: NA,
      env: 'OKTA_AUD'
    },
    clientId: {
      format: String,
      default: NA,
      env: 'OKTA_CLIENT_ID'
    },
    clientSecret: {
      format: String,
      default: NA,
      env: 'OKTA_CLIENT_SECRET'
    },
    issuerUrl: {
      format: String,
      default: NA,
      env: 'OKTA_ISSUER_URL'
    },
    orgUrl: {
      format: String,
      default: NA,
      env: 'OKTA_ORG_URL'
    }
  },
  features: {
    prettyErrors: {
      format: Boolean,
      default: false,
      env: 'ENABLE_PRETTY_ERRORS'
    },
    redis: {
      format: Boolean,
      default: false,
      env: 'ENABLE_REDIS'
    },
    xray: {
      format: Boolean,
      default: true,
      env: 'ENABLE_XRAY'
    },
    logOutgoingRequests: {
      format: Boolean,
      default: false,
      env: 'ENABLE_LOG_OUTGOING'
    },
    enableAV: {
      format: Boolean,
      default: true,
      env: 'ENABLE_AV'
    },
    enableForecastWorkflow: {
      format: Boolean,
      default: false,
      env: 'ENABLE_FORECAST_WORKFLOW'
    }
  },
  rules: {
    minimum_age: {
      doc: 'Minimum age of a Trainee',
      format: Number,
      default: 15,
      env: 'RULES_MINIMUM_AGE'
    },
    maximum_age: {
      doc: 'Maximum age of a Trainee',
      format: Number,
      default: 80,
      env: 'RULES_MAXIMUM_AGE'
    }
  },
  localAuth: {
    format: Boolean,
    default: false,
    env: 'LOCAL_AUTH'
  },
  useLocalKeycloak: {
    doc: 'Bypass Okta and use local Keycloak for local development',
    format: Boolean,
    default: false,
    env: 'USE_LOCAL_KEYCLOAK'
  },
  redis: {
    host: {
      format: String,
      default: '127.0.0.1',
      env: 'REDIS_HOST'
    },
    port: {
      format: Number,
      default: 6379,
      env: 'REDIS_PORT'
    },
    password: {
      format: String,
      default: 'password',
      env: 'REDIS_PASSWORD'
    },
    tls: {
      format: Boolean,
      default: false,
      env: 'REDIS_TLS'
    },
    tlsIgnoreServername: {
      format: Boolean,
      default: false,
      env: 'REDIS_TLS_IGNORE_SERVERNAME'
    }
  }
}

const config = convict(configSchema)
config.validate()

// hack :)
// check if any of the values are NA
function checkNotNa (configList, configParent = []) {
  Object.keys(configList).forEach((configItem) => {
    const configValue = configList[configItem]
    if (typeof configValue === 'string') {
      if (configValue === NA) {
        // get the name of the env variable
        let node = configSchema
        // step through any parent config items
        configParent.forEach((parentItem) => {
          node = node[parentItem]
        })
        throw new Error(configItem + ' is not set. Please set the environment variable ' + node[configItem].env)
      }
    } else {
      // nested config - recursive call checkNotNa
      checkNotNa(configList[configItem], configParent.concat([configItem]))
    }
  })
}

checkNotNa(config.getProperties())

config.set('isDebugEnabled', config.get('logLevel') === 'DEBUG' || config.get('logLevel') === 'debug')

export default config.getProperties()
