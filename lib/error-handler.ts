import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown) {
  console.error('[API Error]', error)

  // Handle known API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  // Handle specific error types
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        error: 'Invalid request format',
        code: 'INVALID_REQUEST',
      },
      { status: 400 }
    )
  }

  if (error instanceof TypeError) {
    return NextResponse.json(
      {
        error: 'Invalid type or missing required field',
        code: 'TYPE_ERROR',
      },
      { status: 400 }
    )
  }

  // Generic error response
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage }),
    },
    { status: 500 }
  )
}

export function validateRequired(obj: Record<string, any>, fields: string[]) {
  const missing = fields.filter((field) => !obj[field])
  if (missing.length > 0) {
    throw new ApiError(
      400,
      `Missing required fields: ${missing.join(', ')}`,
      'MISSING_FIELDS',
      { missing }
    )
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/
  return phoneRegex.test(phone)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
