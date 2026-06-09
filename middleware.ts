import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.method === 'POST' && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/api/casino/callback', request.url))
  }
}

export const config = {
  matcher: '/',
}
