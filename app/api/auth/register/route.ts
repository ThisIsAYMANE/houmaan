import { NextRequest } from 'next/server'
import { registerSchema } from '@/lib/validation'
import { getUserByEmail, createUser, createSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { ValidationError, ConflictError } from '@/lib/errors'
import { queryOne } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Phase 3: Check registration_enabled platform setting before allowing new users
    const registrationSetting = await queryOne<{ value: string }>(
      "SELECT value FROM platform_settings WHERE key = 'registration_enabled'",
      []
    ).catch(() => null)
    if (registrationSetting && registrationSetting.value === 'false') {
      return errorResponse(new Error('Les inscriptions sont temporairement désactivées.'), 403)
    }

    const body = await request.json()
    const validated = registerSchema.safeParse(body)

    if (!validated.success) {
      const fields: Record<string, string> = {}
      validated.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fields[err.path[0].toString()] = err.message
        }
      })
      throw new ValidationError('Invalid registration data', fields)
    }

    const { email, password, username, phone } = validated.data

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      throw new ConflictError('Email already registered')
    }

    // Create user
    const userId = await createUser({
      email,
      password,
      username,
      phone,
    })

    // Get created user
    const user = await getUserByEmail(email)
    if (!user) {
      throw new Error('Failed to create user')
    }

    // Create session
    const sessionToken = await createSession(userId)

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          vipLevel: user.vip_level,
        },
        sessionToken,
      },
      201
    )
  } catch (error) {
    console.error('Registration error:', error)
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
    return errorResponse(error)
  }
}


