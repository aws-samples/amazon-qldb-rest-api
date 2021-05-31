module.exports = {
  setupFiles: [
    'dotenv/config'
  ],
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/e2e.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
