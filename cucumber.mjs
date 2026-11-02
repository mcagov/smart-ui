import dotenv from 'dotenv'
// Stops dot-env promo output noise in the logs
process.env.DOTENV_CONFIG_QUIET = 'true'
dotenv.config()

process.env.LOGGER_TYPE = 'file'

export default {
  parallel: 2,
  format: ['./test/features/support/spec-formatter.mjs', 'html:cucumber-report.html'],
  paths: ['test/**/features/**/*.{feature,feature.md}'],
  publish: false
}
