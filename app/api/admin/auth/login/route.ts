import { NextRequest } from 'next/server'
import { getAdminByEmail, verifyPassword, createAdminSession } from '@/lib/admin-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { z } from 'zod'

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = adminLoginSchema.safeParse(body)

    if (!validated.success) {
      throw new ValidationError('Invalid login data', validated.error.errors)
    }

    const { email, password } = validated.data

    // Get admin user
    const admin = await getAdminByEmail(email)
    if (!admin || !admin.password_hash) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password_hash)
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Check if admin is active
    if (!admin.is_active) {
      throw new UnauthorizedError('Account is deactivated')
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create admin session
    const sessionToken = await createAdminSession(admin.id, ipAddress, userAgent)

    return successResponse({
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
      sessionToken,
    })
  } catch (error) {
    return errorResponse(error)
  }
}











