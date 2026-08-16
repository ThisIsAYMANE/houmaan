const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  // Override environment for integration tests which import Next.js API routes
  testEnvironmentOptions: {},
  // Use testPathPattern to change env for API/integration tests
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '<rootDir>/__tests__/lib/**/*.[jt]s?(x)',
        '<rootDir>/__tests__/components/**/*.[jt]s?(x)',
        '<rootDir>/__tests__/api/**/*.[jt]s?(x)',
      ],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      moduleDirectories: ['node_modules', '<rootDir>/'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '<rootDir>/__tests__/integration/**/*.[jt]s?(x)',
      ],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      moduleDirectories: ['node_modules', '<rootDir>/'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
    },
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)





