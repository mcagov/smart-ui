export default {
  roots: [
    '<rootDir>/test/integration/'
  ],
  globalSetup: '<rootDir>/test/jestGlobalSetup.js',
  globalTeardown: '<rootDir>/test/jestGlobalTearDown.js',
  setupFilesAfterEnv: [
    '<rootDir>/test/jestSetup.js',
    'jest-extended'
  ],
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: {}
}
