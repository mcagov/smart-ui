import merge from 'deepmerge';
import {baseConfig} from './base.conf.js';

const hostIp = process.env.DOCKER_HOST_IP || '127.0.0.1';
const targetUrl = process.env.UI_URL || 'http://localhost:2997';

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
        '--window-size=1920,1080',
        '--ignore-certificate-errors',
        `--host-resolver-rules=MAP service.local.smart.mcga.uk ${hostIp}, MAP id.local.smart.mcga.uk ${hostIp}`,
        `--unsafely-treat-insecure-origin-as-secure=${targetUrl}`
      ]
    }
  }]
})
