const merge = require('deepmerge')
const baseConfig = require('./base.conf.cjs')
require('dotenv')

exports.config = merge(baseConfig.config, {
  maxInstances: 1,
  bail: 5,
  capabilities: [{
    maxInstances: 1,
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: [
        '--disable-gpu',
        '--disable-impl-side-painting',
        '--disable-gpu-sandbox',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-jpeg-decoding',
        '--no-sandbox'
      ]
    }
  }],
  beforeSuite: async () => {
    // move the WDIO window?
    if (process.env.WDIO_X) {
      console.log(`moving window to ${process.env.WDIO_X}:${process.env.WDIO_Y}`)
      browser.setWindowRect(
        parseInt(process.env.WDIO_X),
        parseInt(process.env.WDIO_Y),
        parseInt(process.env.WDIO_W),
        parseInt(process.env.WDIO_H)
      )
    } else {
      console.log('not moving window as did not find process.env.WDIO_X')
    }
    browser.maximizeWindow()
  }
})
