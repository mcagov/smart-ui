import {app} from '../src/app.js'
import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { expressLogger, logger } from '@mca/common-logger'

let server;
let capturedLogs = [];
let consoleSpy;

describe('Service Logging E2E Test', () => {
  beforeAll((done) => {

    app.get('/test-json-log', (req, res) => {
      res.status(200).send('OK');
    });
    const useExpressLogger = app.use(expressLogger);
    server = useExpressLogger.listen(done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    capturedLogs = [];
    consoleSpy = jest.spyOn(logger, 'info')
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should output a valid JSON log for a GET request', async () => {

    const response = await request(server).get('/');

    expect(response.status).toBe(200);

    const capturedLogs = consoleSpy.mock.calls[0]

    expect(capturedLogs).toBeDefined();

    let parsedLog = JSON.parse(capturedLogs);
    logger.log(parsedLog);
    expect(parsedLog).toHaveProperty( 'level', 'info');
    expect(parsedLog).toHaveProperty('method', 'GET');
    expect(parsedLog).toHaveProperty('status', "200");
    expect(parsedLog).toHaveProperty('url', '/');
    expect(parsedLog).toHaveProperty('http-version', '1.1')
    expect(parsedLog).toHaveProperty('remote-addr', '::ffff:127.0.0.1')
    expect(parsedLog).toHaveProperty('remote-user', '-')
    expect(parsedLog).toHaveProperty('content-length', '-')
    expect(parsedLog).toHaveProperty('referrer', '-')
    expect(parsedLog).toHaveProperty('user-agent', '-')
    expect(parsedLog).toHaveProperty('response-time', `${parsedLog['response-time']}`)
  });
});
