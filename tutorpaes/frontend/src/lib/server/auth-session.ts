import { NextResponse } from 'next/server';

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://127.0.0.1:8000';

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set('access_token', '', { ...getCookieOptions(0), maxAge: 0 });
  response.cookies.set('refresh_token', '', { ...getCookieOptions(0), maxAge: 0 });
}

export async function relayAuthResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorResponse = NextResponse.json(
      { error: payload?.detail || payload?.error || 'No se pudo completar la autenticación' },
      { status: response.status },
    );
    clearAuthCookies(errorResponse);
    return errorResponse;
  }

  const nextResponse = NextResponse.json({
    user_id: payload.user_id,
    email: payload.email,
    name: payload.name,
    is_admin: payload.is_admin,
  });

  if (payload.access_token) {
    nextResponse.cookies.set('access_token', payload.access_token, getCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS));
  }

  if (payload.refresh_token) {
    nextResponse.cookies.set('refresh_token', payload.refresh_token, getCookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS));
  }

  return nextResponse;
}