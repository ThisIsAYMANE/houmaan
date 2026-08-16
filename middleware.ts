import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Phase 3: Must be Node.js runtime — better-sqlite3 is a native Node module
// and cannot run on the Edge runtime.
export const runtime = 'nodejs'

/**
 * Read a platform setting from the DB.
 * We use a dynamic require so this only loads in Node runtime.
 */
function getPlatformSetting(key: string): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3')
    const path = require('path')
    const dbPath = path.join(process.cwd(), 'data', 'houman.db')
    const db = new Database(dbPath, { readonly: true })
    const row = db.prepare('SELECT value FROM platform_settings WHERE key = ?').get(key) as { value: string } | undefined
    db.close()
    return row?.value ?? null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Existing: rewrite POST / to casino callback
  if (request.method === 'POST' && pathname === '/') {
    return NextResponse.rewrite(new URL('/api/casino/callback', request.url))
  }

  // Phase 3: Maintenance mode gate
  // Admin panel and API routes always bypass (admins need to turn it off)
  const isAdminPath = pathname.startsWith('/admin')
  const isApiPath = pathname.startsWith('/api')
  const isStaticPath = pathname.startsWith('/_next') || pathname.startsWith('/favicon')

  if (!isAdminPath && !isApiPath && !isStaticPath) {
    const maintenanceMode = getPlatformSetting('maintenance_mode')
    if (maintenanceMode === 'true') {
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site en maintenance — Shartbandee</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #f1f5f9;
    }
    .card {
      text-align: center;
      padding: 3rem 4rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1.5rem;
      backdrop-filter: blur(12px);
      max-width: 480px;
    }
    .icon { font-size: 4rem; margin-bottom: 1.5rem; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem; }
    p { color: #94a3b8; line-height: 1.6; font-size: 1rem; }
    .badge {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.4rem 1rem;
      background: rgba(234,179,8,0.15);
      color: #fbbf24;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔧</div>
    <h1>Site en maintenance</h1>
    <p>Nous effectuons des améliorations pour vous offrir une meilleure expérience. Revenez très bientôt !</p>
    <div class="badge">Maintenance en cours</div>
  </div>
</body>
</html>`,
        {
          status: 503,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Retry-After': '3600',
          },
        }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
