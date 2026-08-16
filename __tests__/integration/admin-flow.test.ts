/**
 * @jest-environment node
 */
/**
 * Integration Tests - Admin Stats & Settings API
 */
import { GET as getStats } from '@/app/api/admin/stats/route'
import { GET as getSettings, PUT as putSettings } from '@/app/api/admin/settings/route'
import { NextRequest } from 'next/server'
import { query, queryOne } from '@/lib/db'
import * as adminMiddleware from '@/lib/admin-middleware'

jest.mock('@/lib/db')
jest.mock('@/lib/admin-middleware', () => ({
  requireAdmin: jest.fn(),
}))
jest.mock('@/lib/bonus-db', () => ({ runBonusMigrations: jest.fn() }))

const mockQuery = query as jest.MockedFunction<typeof query>
const mockRequireAdmin = adminMiddleware.requireAdmin as jest.MockedFunction<typeof adminMiddleware.requireAdmin>

function adminRequest(url: string, method: 'GET' | 'PUT' = 'GET', body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: {
      'x-admin-token': 'valid-admin-token',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  // Default: admin auth passes
  mockRequireAdmin.mockResolvedValue({ adminId: 'admin-1' } as never)
})

// ─────────────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────────────
describe('GET /api/admin/stats', () => {
  it('returns 401 when admin auth fails', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAdmin.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
    const req = adminRequest('http://localhost/api/admin/stats')
    const res = await getStats(req)
    expect(res.status).toBe(401)
  })

  it('returns stats with correct structure when all tables are empty', async () => {
    // All queries return zero counts
    mockQuery.mockResolvedValue({ rows: [{ count: 0, total: 0 }], rowCount: 1 })

    const req = adminRequest('http://localhost/api/admin/stats')
    const res = await getStats(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data).toBeDefined()
    expect(data.data.users).toBeDefined()
    expect(data.data.betting).toBeDefined()
    expect(data.data.financial).toBeDefined()
  })

  it('returns non-zero stats when data exists', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 42 }], rowCount: 1 })  // totalUsers
      .mockResolvedValueOnce({ rows: [{ count: 38 }], rowCount: 1 })  // activeUsers
      .mockResolvedValue({ rows: [{ count: 0, total: 0 }], rowCount: 1 }) // rest

    const req = adminRequest('http://localhost/api/admin/stats')
    const res = await getStats(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.users.total).toBe(42)
    expect(data.data.users.active).toBe(38)
  })
})

// ─────────────────────────────────────────────────────
// GET /api/admin/settings
// ─────────────────────────────────────────────────────
describe('GET /api/admin/settings', () => {
  it('returns all platform settings as key-value object', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { key: 'maintenance_mode', value: 'false', updated_at: '2024-01-01' },
        { key: 'registration_enabled', value: 'true', updated_at: '2024-01-01' },
        { key: 'min_deposit', value: '20', updated_at: '2024-01-01' },
      ],
      rowCount: 3,
    })

    const req = adminRequest('http://localhost/api/admin/settings')
    const res = await getSettings(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.maintenance_mode).toBe('false')
    expect(data.data.registration_enabled).toBe('true')
    expect(data.data.min_deposit).toBe('20')
  })
})

// ─────────────────────────────────────────────────────
// PUT /api/admin/settings
// ─────────────────────────────────────────────────────
describe('PUT /api/admin/settings', () => {
  it('updates settings and returns list of updated keys', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    const req = adminRequest(
      'http://localhost/api/admin/settings',
      'PUT',
      { maintenance_mode: 'true', registration_enabled: 'false' }
    )
    const res = await putSettings(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.updated).toContain('maintenance_mode')
    expect(data.updated).toContain('registration_enabled')
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(key) DO UPDATE'),
      expect.arrayContaining(['maintenance_mode', 'true'])
    )
  })

  it('returns 400 when no settings to update are provided', async () => {
    const req = adminRequest('http://localhost/api/admin/settings', 'PUT', {})
    const res = await putSettings(req)
    expect(res.status).toBe(400)
  })
})

