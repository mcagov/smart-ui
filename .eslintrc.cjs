module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    'jest/globals': true,
    'webdriverio/wdio': true
  },
  extends: ['standard'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['jest', 'webdriverio'],
  ignorePatterns: ['src/public/', 'src/bin/']
}
