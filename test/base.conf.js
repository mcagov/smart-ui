import 'dotenv/config'
import path from 'node:path'
import moment from 'moment-timezone'

import { ReportAggregator } from 'wdio-html-nice-reporter'
let reportAggregator

export const baseConfig = {
  specs: [path.join(process.cwd(), 'test/browser/journeys/**/*.spec.js')],
  suites: {
    all: ['./test/browser/journeys/*.spec.js'],
    admin: [
      './test/browser/journeys/admin-create-new-client-company.spec.js',
      './test/browser/journeys/admin-create-new-smart-categoy.spec.js',
      './test/browser/journeys/admin-create-new-smart-item.spec.js',
      './test/browser/journeys/admin-create-new-training-item.spec.js'
      // './test/browser/journeys/admin-view-payment-schedules.js',
    ],
    claims: [
      './test/browser/journeys/tp-create-claim-admin-approve.spec.js',
      './test/browser/journeys/tp-create-forecast.spec.js'
      // './test/browser/journeys/admin-view-claims.spec.js',
    ],
    trainingProvider: [
      './test/browser/journeys/admin-create-training-provider.spec.js',
      './test/browser/journeys/admin-update-training-provider-status.spec.js',
      './test/browser/journeys/admin-update-training-provider.spec.js',
      './test/browser/journeys/admin-view-training-providers.spec.js'
      // attachments
      // users
    ],
    training: ['./test/browser/journeys/admin-create-new-training.spec.js', './test/browser/journeys/tp-view-single-training.spec.js'],
    trainee: [
      './test/browser/journeys/tp-comment-on-trainee.spec.js',
      './test/browser/journeys/tp-create-new-trainee.spec.js',
      './test/browser/journeys/tp-enrol-trainee.spec.js',
      './test/browser/journeys/tp-create-absence.spec.js',
      './test/browser/journeys/admin-remove-trainee-client-company.spec.js'
      // attachments
    ],
    debug: [
      //'./test/browser/journeys/*view-single*.spec.js',
      './test/browser/journeys/admin-remove-trainee-client-company.spec.js'
      // './test/browser/journeys/tp-create-claim-admin-approve.spec.js',
      // './test/browser/journeys/*client-company*.spec.js',
      // './test/browser/journeys/tp-create-absence.spec.js'
      // './test/browser/journeys/*create-claim*.spec.js'
      // './test/browser/journeys/tp-view-single-training.spec.js',
      // './test/browser/journeys/*update-training-provider.spec.js',
      // './test/browser/journeys/*create-training-provider*.spec.js'
    ]
  },
  exclude: [],
  maxInstances: 1,
  logLevel: 'info',
  bail: 5,
  baseUrl: process.env.UI_URL,
  waitforTimeout: 5000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: [],
  framework: 'mocha',
  outputDir: './wdio-output',
  reporters: [
    'spec',
    [
      'junit',
      {
        outputDir: 'wdio-output/',
        outputFileFormat: function (options) {
          // optional
          return `results-${options.cid}.${options.capabilities.browserName}.xml`
        }
      }
    ],
    [
      'html-nice',
      {
        debug: false,
        outputDir: './wdio-output/html-reports/',
        filename: 'report.html',
        reportTitle: 'WDIO Report',
        collapseTests: true,
        collapseSuites: true,
        showInBrowser: false,
        useOnAfterCommandForScreenshot: false,
        linkScreenshots: true
        // LOG: log4j.getLogger('default')
      }
    ]
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    retries: 3
  },
  onPrepare: function (config, capabilities) {
    reportAggregator = new ReportAggregator(
      {
        outputDir: './wdio-output/html-reports/',
        filename: 'wdio-report.html',
        browserName: capabilities[0].browserName,
        collapseTests: true,
        collapseSuites: true,
        reportTitle: 'SMarT UI WDIO Test Report',
        linkScreenshots: true,
        showInBrowser: false
      })
    reportAggregator.clean()
  },
  onComplete: function (exitCode, config, capabilities, results) {
    (async () => {
      await reportAggregator.createReport()
    })()
  },
  afterTest: function (test, context, { error, result, duration, passed, retries }) {
    // take a screenshot anytime a test fails and throws an error
    if (error) {
      console.log('taking screen shot')
      const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss-SSS')
      const screenshotFilePath = './wdio-output/TESTFAIL_' + timestamp + '_' + path.basename(test.file) + '.png'
      // // save screenshot
      browser.saveScreenshot(screenshotFilePath)
      console.log(`Saved screenshot: ${screenshotFilePath}`)
    }
  }
}
