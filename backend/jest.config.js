module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  testTimeout: 60000,
  globalTeardown: '<rootDir>/tests/helpers/teardown.js',
};
