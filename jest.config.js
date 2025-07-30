export default {
  clearMocks: true,
  coverageDirectory: 'reports',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/{!(ignore-me),}.js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/test/browser'
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/public',
    '<rootDir>/src/local.oidc.js',
    '<rootDir>/src/request-logger.js',
    '<rootDir>/src/services/local.users.js',
    // Covered by WDIO
    '<rootDir>/src/routes',
    '<rootDir>/src/controllers',
    '<rootDir>/src/bin'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'cobertura'
  ],
  globalSetup: '<rootDir>/test/jestGlobalSetup.js',
  globalTeardown: '<rootDir>/test/jestGlobalTearDown.js',
  roots: [
    '<rootDir>/src/',
    '<rootDir>/test/'
  ],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports',
      outputName: 'junit.xml',
      usePathForSuiteName: 'true'
    }],
    [
      'jest-sonar',
      {
        outputDirectory: 'reports',
        outputName: 'sonar.xml'
      }
    ],
    ['jest-html-reporters', {
      publicPath: './reports',
      filename: 'report.html',
      expand: true
    }]
  ],
  setupFilesAfterEnv: [
    '<rootDir>/test/jestSetup.js',
    'jest-extended'
  ],
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: {}
}
