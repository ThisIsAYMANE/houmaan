import { NextResponse } from 'next/server'
import { AppError } from './errors'

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

export function errorResponse(error: unknown, status?: number) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          ...(error instanceof Error && 'fields' in error
            ? { fields: (error as any).fields }
            : {}),
        },
      },
      { status: status || error.statusCode }
    )
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: 'INTERNAL_ERROR',
      },
    },
    { status: status || 500 }
  )
}




