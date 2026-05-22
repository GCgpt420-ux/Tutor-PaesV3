import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Construye Content Security Policy header con nonce
 */
function buildCsp() {
  const isDev = process.env.NODE_ENV !== 'production'

  const scriptSrc = isDev
    ? [
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "https:",
        "http:",
      ]
    : [
        "script-src 'self' 'unsafe-inline'",
        "https:",
      ]
  
  const scriptSrcString = scriptSrc.join(' ')

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrcString,
    "connect-src 'self' https: http://127.0.0.1:8000 http://localhost:8000",
    "form-action 'self' https://webpay3gint.transbank.cl https://webpay3g.transbank.cl",
  ].join('; ')
}

/**
 * Decodifica el payload de un JWT sin verificar firma
 * (La verificación ocurre en el backend)
 */
function decodeJWT(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Revisa si un JWT está expirado
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) return false
  
  // exp está en segundos; se compara contra Date.now() en milisegundos
  const expirationMs = payload.exp * 1000
  return Date.now() > expirationMs
}

/**
 * Handler unificado de proxy: CSP + Autenticacion
 */
export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const csp = buildCsp()
  const token = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  
  if (request.nextUrl.pathname.startsWith('/protected') && !token && !refreshToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (token && isTokenExpired(token) && !refreshToken) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    return response
  }

  const hasRecoverableSession = Boolean(refreshToken) || Boolean(token && !isTokenExpired(token))

  if (
    (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/sign-up')) &&
    hasRecoverableSession
  ) {
    return NextResponse.redirect(new URL('/protected', request.url))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)

  return response
}

// Matcher unificado: cubre autenticación + CSP en todas las rutas públicas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}