# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the Bitcoin betting platform, including unit tests, integration tests, and component tests.

## Test Structure

```
__tests__/
├── api/                    # API route tests
│   ├── auth/
│   ├── bets/
│   └── notifications/
├── components/             # React component tests
│   ├── layout/
│   └── casino/
├── lib/                    # Utility/library tests
│   ├── db.test.ts
│   ├── auth.test.ts
│   ├── wallet.test.ts
│   ├── validation.test.ts
│   └── notifications.test.ts
└── integration/            # Integration tests
    ├── wallet-flow.test.ts
    └── bet-flow.test.ts
```

## Running Tests

### Run All Tests
```bash
npm run test:unit
```

### Run Tests in Watch Mode
```bash
npm run test:unit:watch
```

### Run Tests with Coverage
```bash
npm run test:unit:coverage
```

### Run Specific Test File
```bash
npm run test:unit -- __tests__/lib/wallet.test.ts
```

### Run Tests Matching Pattern
```bash
npm run test:unit -- --testNamePattern="wallet"
```

## Test Categories

### 1. Unit Tests (`__tests__/lib/`)

Tests for utility functions and libraries:

- **db.test.ts**: Database query functions, transactions
- **auth.test.ts**: Authentication, password hashing, sessions
- **wallet.test.ts**: Wallet operations, balance management
- **validation.test.ts**: Input validation schemas
- **notifications.test.ts**: Notification creation and sending

### 2. API Route Tests (`__tests__/api/`)

Tests for Next.js API routes:

- **auth/login.test.ts**: Login endpoint
- **bets/route.test.ts**: Bet placement and retrieval
- **notifications/route.test.ts**: Notification CRUD operations

### 3. Component Tests (`__tests__/components/`)

Tests for React components:

- **layout/NotificationBell.test.tsx**: Notification bell component
- **casino/GameCard.test.tsx**: Game card component

### 4. Integration Tests (`__tests__/integration/`)

End-to-end flow tests:

- **wallet-flow.test.ts**: Complete wallet operations flow
- **bet-flow.test.ts**: Complete betting flow

## Writing New Tests

### Example: API Route Test

```typescript
import { POST } from '@/app/api/your-route/route'
import { NextRequest } from 'next/server'
import { query } from '@/lib/db'

jest.mock('@/lib/db')

describe('POST /api/your-route', () => {
  it('should handle request successfully', async () => {
    const mockQuery = query as jest.MockedFunction<typeof query>
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    const request = new NextRequest('http://localhost/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ /* test data */ }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

### Example: Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import YourComponent from '@/components/YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', () => {
    const handleClick = jest.fn()
    render(<YourComponent onClick={handleClick} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalled()
  })
})
```

## Mocking

### Database Queries

```typescript
jest.mock('@/lib/db')

const mockQuery = query as jest.MockedFunction<typeof query>
mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
```

### API Calls

```typescript
global.fetch = jest.fn()
;(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
})
```

### Next.js Router

Already mocked in `jest.setup.js`:
- `useRouter()`
- `usePathname()`
- `useSearchParams()`

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clear Test Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Mock database, API calls, etc.
5. **Test Edge Cases**: Include error cases and boundary conditions
6. **Keep Tests Fast**: Avoid slow operations in unit tests

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

Tests should run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

## Troubleshooting

### Tests Failing

1. Check if mocks are properly set up
2. Verify database queries are mocked
3. Ensure async operations are properly awaited
4. Check for console errors in test output

### Coverage Issues

1. Run coverage report: `npm run test:unit:coverage`
2. Check `coverage/` folder for detailed report
3. Identify untested code paths
4. Add tests for missing coverage

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)

