import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL, clearAuthCookies, relayAuthResponse } from '@/src/lib/server/auth-session';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    const response = NextResponse.json({ error: 'Refresh token no disponible' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: `refresh_token=${refreshToken}`,
    },
  });

  return relayAuthResponse(backendResponse);
}