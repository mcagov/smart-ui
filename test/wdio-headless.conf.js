import merge from 'deepmerge';
import {baseConfig} from './base.conf.js';

export const config = merge(baseConfig, {
  maxInstances: 1,
  bail: 5,
  capabilities: [{
    maxInstances: 1,
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: [
        '--disable-gpu',
        '--disable-impl-side-painting',
        '--disable-dev-shm-usage',
        '--disable-gpu-sandbox',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-jpeg-decoding',
        '--no-sandbox',
        '--test-type=ui',
        '--headless',
        '--logLevel=debug',
        '--window-size=1920,1080'
      ]
    }
  }]
})
