/** @jest-environment node */
import { POST as register } from "@/app/api/auth/register/route"
import { POST as login } from "@/app/api/auth/login/route"
import { GET as getSession } from "@/app/api/auth/session/route"
import { NextRequest } from "next/server"
import * as db from "@/lib/db"
import * as auth from "@/lib/auth"

// Mock the entire auth library — all functions replaced with jest.fn()
jest.mock("@/lib/auth", () => ({
  hashPassword:   jest.fn(),
  verifyPassword: jest.fn(),
  createSession:  jest.fn(),
  createUser:     jest.fn(),
  getSession:     jest.fn(),
  getUserByEmail: jest.fn(),
  getUserById:    jest.fn(),
  deleteSession:  jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  query:       jest.fn(),
  queryOne:    jest.fn(),
  transaction: jest.fn(),
}))

jest.mock("nanoid", () => ({ nanoid: jest.fn(() => "uid-xyz") }))

const mockQuery    = db.query    as jest.MockedFunction<typeof db.query>
const mockQueryOne = db.queryOne as jest.MockedFunction<typeof db.queryOne>
const mockTx       = db.transaction as jest.MockedFunction<typeof db.transaction>

beforeEach(() => {
  // resetAllMocks clears implementations AND the once-return-value queues
  jest.resetAllMocks()
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("returns 400-499 when required fields are missing (Zod validation)", async () => {
    // registration check — returns null = enabled
    mockQueryOne.mockResolvedValueOnce(null)

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com" }), // missing password + username
    })
    const res = await register(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })

  it("returns 409 when the email is already registered", async () => {
    mockQueryOne.mockResolvedValueOnce(null) // registration open
    ;(auth.getUserByEmail as jest.Mock).mockResolvedValue({ id: "existing-user" })

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "exists@test.com", password: "Password1!", username: "existinguser" }),
    })
    const res = await register(req)
    expect(res.status).toBe(409)
  })

  it("returns 201 + session token on valid registration", async () => {
    mockQueryOne.mockResolvedValueOnce(null) // registration open
    ;(auth.getUserByEmail as jest.Mock)
      .mockResolvedValueOnce(null)              // no duplicate check
      .mockResolvedValueOnce({                  // after createUser — get user
        id: "uid-xyz", email: "new@test.com", username: "newuser",
        avatar: null, vip_level: 0, is_active: true,
      })
    ;(auth.createUser   as jest.Mock).mockResolvedValue("uid-xyz")
    ;(auth.createSession as jest.Mock).mockResolvedValue("tok-abc")

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "new@test.com", password: "Password1!", username: "newuser" }),
    })
    const res = await register(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.data.sessionToken).toBe("tok-abc")
    expect(data.data.user.email).toBe("new@test.com")
  })

  it("returns 403 when registration is disabled in platform settings", async () => {
    mockQueryOne.mockResolvedValueOnce({ value: "false" })

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "new@test.com", password: "Password1!", username: "newuser" }),
    })
    const res = await register(req)
    expect(res.status).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  it("returns 401 for non-existent email", async () => {
    ;(auth.getUserByEmail as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "nobody@test.com", password: "Password1!" }),
    })
    const res = await login(req)
    expect(res.status).toBe(401)
  })

  it("returns 401 for incorrect password", async () => {
    ;(auth.getUserByEmail as jest.Mock).mockResolvedValue({
      id: "user-1", email: "test@test.com",
      password_hash: "hashed-correct", is_active: true,
    })
    ;(auth.verifyPassword as jest.Mock).mockResolvedValue(false)

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", password: "wrong" }),
    })
    const res = await login(req)
    expect(res.status).toBe(401)
  })

  it("returns 200 + session token for valid credentials", async () => {
    ;(auth.getUserByEmail as jest.Mock).mockResolvedValue({
      id: "user-1", email: "test@test.com", username: "testuser",
      password_hash: "hashed", is_active: true, vip_level: 0, avatar: null,
    })
    ;(auth.verifyPassword  as jest.Mock).mockResolvedValue(true)
    ;(auth.createSession   as jest.Mock).mockResolvedValue("tok-abc")

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", password: "Password1!" }),
    })
    const res = await login(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.sessionToken).toBe("tok-abc")
    expect(data.data.user.email).toBe("test@test.com")
  })

  it("returns 401 for deactivated accounts", async () => {
    ;(auth.getUserByEmail as jest.Mock).mockResolvedValue({
      id: "user-1", email: "banned@test.com",
      password_hash: "hashed", is_active: false,
    })
    ;(auth.verifyPassword as jest.Mock).mockResolvedValue(true)

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "banned@test.com", password: "Password1!" }),
    })
    const res = await login(req)
    expect(res.status).toBe(401) // UnauthorizedError → 401
  })
})

// ─────────────────────────────────────────────────────────
// GET /api/auth/session
// ─────────────────────────────────────────────────────────
describe("GET /api/auth/session", () => {
  it("returns 401 when no token is provided", async () => {
    const req = new NextRequest("http://localhost/api/auth/session")
    const res = await getSession(req)
    expect(res.status).toBe(401)
  })

  it("returns 200 + user object for a valid session token", async () => {
    ;(auth.getSession   as jest.Mock).mockResolvedValue({ userId: "user-1" })
    ;(auth.getUserById  as jest.Mock).mockResolvedValue({
      id: "user-1", email: "test@test.com", username: "testuser",
      avatar: null, vip_level: 0, is_active: true,
    })

    const req = new NextRequest("http://localhost/api/auth/session", {
      headers: { Authorization: "Bearer tok-abc" },
    })
    const res = await getSession(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.user.email).toBe("test@test.com")
  })

  it("returns 401 for an expired or invalid session token", async () => {
    ;(auth.getSession as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest("http://localhost/api/auth/session", {
      headers: { Authorization: "Bearer expired-token" },
    })
    const res = await getSession(req)
    expect(res.status).toBe(401)
  })
})
