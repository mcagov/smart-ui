import dotenv from 'dotenv'
dotenv.config()

// process.env.LOGGER_TYPE = 'file'

export default {
  parallel: 2,
  format: ['html:cucumber-report.html'],
  paths: ['test/**/features/**/*.{feature,feature.md}'],
  publish: false,
  publishQuiet: true
}