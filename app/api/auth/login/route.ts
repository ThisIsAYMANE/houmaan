import { NextRequest } from 'next/server'
import { loginSchema } from '@/lib/validation'
import { getUserByEmail, verifyPassword, createSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.safeParse(body)

    if (!validated.success) {
      throw new ValidationError('Invalid login data', validated.error.errors)
    }

    const { email, password } = validated.data

    // Get user
    const user = await getUserByEmail(email)
    if (!user || !user.password_hash) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated')
    }

    // Create session
    const sessionToken = await createSession(user.id)

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        vipLevel: user.vip_level,
      },
      sessionToken,
    })
  } catch (error) {
    return errorResponse(error)
  }
}











