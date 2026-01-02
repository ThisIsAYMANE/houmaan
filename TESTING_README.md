# Testing Guide - Bitcoin Betting Platform

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Setup](#test-setup)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Writing Tests](#writing-tests)
6. [Test Categories](#test-categories)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

This project uses **Jest** and **React Testing Library** for comprehensive testing of:
- API routes (Next.js API handlers)
- React components
- Utility functions and libraries
- Integration flows

## Test Setup

### Prerequisites

Ensure you have installed all dependencies:

```bash
npm install
```

### Configuration Files

- **`jest.config.js`**: Jest configuration
- **`jest.setup.js`**: Test environment setup and global mocks
- **`tsconfig.json`**: TypeScript configuration (already configured)

## Running Tests

### Run All Tests

```bash
npm run test:unit
```

### Run Tests in Watch Mode

Watch for file changes and re-run tests automatically:

```bash
npm run test:unit:watch
```

### Run Tests with Coverage Report

Generate a coverage report showing which code is tested:

```bash
npm run test:unit:coverage
```

The coverage report will be generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in your browser to view the detailed report.

### Run Specific Test File

Run a single test file:

```bash
npm run test:unit -- __tests__/lib/wallet.test.ts
```

### Run Tests Matching a Pattern

Run tests whose names match a pattern:

```bash
npm run test:unit -- --testNamePattern="wallet"
```

### Run Tests in a Specific Directory

```bash
npm run test:unit -- __tests__/api
```

## Test Structure

```
__tests__/
├── api/                          # API route tests
│   ├── auth/
│   │   └── login.test.ts         # Login endpoint tests
│   ├── bets/
│   │   └── route.test.ts        # Bet placement tests
│   └── notifications/
│       └── route.test.ts         # Notification API tests
│
├── components/                   # React component tests
│   ├── layout/
│   │   └── NotificationBell.test.tsx
│   └── casino/
│       └── GameCard.test.tsx
│
├── lib/                          # Utility/library tests
│   ├── db.test.ts               # Database utilities
│   ├── auth.test.ts             # Authentication utilities
│   ├── wallet.test.ts           # Wallet operations
│   ├── validation.test.ts       # Input validation
│   └── notifications.test.ts    # Notification helpers
│
└── integration/                  # Integration tests
    ├── wallet-flow.test.ts      # Complete wallet flow
    └── bet-flow.test.ts         # Complete betting flow
```

## Writing Tests

### 1. API Route Test Example

```typescript
import { POST } from '@/app/api/your-route/route'
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'

jest.mock('@/lib/db')

describe('POST /api/your-route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle successful request', async () => {
    // Arrange
    const mockQuery = query as jest.MockedFunction<typeof query>
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    const request = new NextRequest('http://localhost/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should handle errors gracefully', async () => {
    const mockQuery = query as jest.MockedFunction<typeof query>
    mockQuery.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/your-route', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })
})
```

### 2. Component Test Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import YourComponent from '@/components/YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent title="Test Title" />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const handleClick = jest.fn()
    render(<YourComponent onClick={handleClick} />)
    
    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle async operations', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    })

    render(<YourComponent />)
    
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    })
  })
})
```

### 3. Utility Function Test Example

```typescript
import { yourFunction } from '@/lib/your-lib'

describe('yourFunction', () => {
  it('should return expected result', () => {
    const result = yourFunction('input')
    expect(result).toBe('expected-output')
  })

  it('should handle edge cases', () => {
    expect(() => yourFunction(null)).toThrow('Invalid input')
  })
})
```

## Test Categories

### Unit Tests

Test individual functions and utilities in isolation:

- **Location**: `__tests__/lib/`
- **Purpose**: Test pure functions, utilities, helpers
- **Example**: `wallet.test.ts`, `validation.test.ts`

### API Route Tests

Test Next.js API route handlers:

- **Location**: `__tests__/api/`
- **Purpose**: Test HTTP endpoints, request/response handling
- **Example**: `auth/login.test.ts`, `bets/route.test.ts`

### Component Tests

Test React components:

- **Location**: `__tests__/components/`
- **Purpose**: Test UI components, user interactions
- **Example**: `NotificationBell.test.tsx`, `GameCard.test.tsx`

### Integration Tests

Test complete flows and interactions:

- **Location**: `__tests__/integration/`
- **Purpose**: Test end-to-end workflows
- **Example**: `wallet-flow.test.ts`, `bet-flow.test.ts`

## Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
it('should do something', () => {
  // Arrange: Set up test data and mocks
  const mockData = { id: '1', name: 'Test' }
  
  // Act: Execute the function being tested
  const result = yourFunction(mockData)
  
  // Assert: Verify the result
  expect(result).toBe('expected')
})
```

### 2. Descriptive Test Names

```typescript
// ❌ Bad
it('test1', () => { ... })

// ✅ Good
it('should return user when valid email is provided', () => { ... })
```

### 3. Isolate Tests

Each test should be independent and not rely on other tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks() // Clear mocks between tests
})
```

### 4. Mock External Dependencies

Always mock database, API calls, and external services:

```typescript
jest.mock('@/lib/db')
jest.mock('@/lib/auth')
```

### 5. Test Edge Cases

Include tests for:
- Error conditions
- Boundary values
- Null/undefined inputs
- Empty inputs

### 6. Use Appropriate Assertions

```typescript
// For equality
expect(value).toBe(expected)

// For objects/arrays
expect(value).toEqual(expected)

// For truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()

// For errors
expect(() => function()).toThrow()
```

## Common Mocking Patterns

### Mock Database Queries

```typescript
import { query, queryOne } from '@/lib/db'

jest.mock('@/lib/db')

const mockQuery = query as jest.MockedFunction<typeof query>
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>

mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
mockQueryOne.mockResolvedValue(null)
```

### Mock API Calls

```typescript
global.fetch = jest.fn()

;(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
})
```

### Mock Next.js Router

Already configured in `jest.setup.js`:

```typescript
// Automatically mocked:
// - useRouter()
// - usePathname()
// - useSearchParams()
```

## Troubleshooting

### Tests Not Running

1. **Check Node version**: Ensure you're using Node.js 18+
2. **Clear cache**: `npm run test:unit -- --clearCache`
3. **Reinstall dependencies**: `rm -rf node_modules && npm install`

### Tests Failing

1. **Check mocks**: Ensure all external dependencies are mocked
2. **Check async operations**: Use `await` and `waitFor` appropriately
3. **Check console output**: Look for error messages in test output

### Coverage Issues

1. **Run coverage**: `npm run test:unit:coverage`
2. **View report**: Open `coverage/lcov-report/index.html`
3. **Identify gaps**: Look for untested code paths
4. **Add tests**: Write tests for uncovered code

### TypeScript Errors

1. **Check imports**: Ensure correct import paths
2. **Check types**: Verify TypeScript types are correct
3. **Run type check**: `npm run type-check`

## Test Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

Tests should run automatically:
- On pull requests
- On commits to main branch
- Before deployment

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Quick Reference

```bash
# Run all tests
npm run test:unit

# Watch mode
npm run test:unit:watch

# Coverage
npm run test:unit:coverage

# Specific file
npm run test:unit -- __tests__/lib/wallet.test.ts

# Pattern matching
npm run test:unit -- --testNamePattern="wallet"

# Update snapshots
npm run test:unit -- -u
```

---

**Happy Testing! 🧪**

