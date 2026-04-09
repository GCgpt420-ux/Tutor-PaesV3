import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL, clearAuthCookies } from '@/src/lib/server/auth-session';

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // Best-effort: tell the backend to revoke both JTIs
  await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      Cookie: [
        accessToken ? `access_token=${accessToken}` : '',
        refreshToken ? `refresh_token=${refreshToken}` : '',
      ].filter(Boolean).join('; '),
    },
  }).catch(() => {
    // Silently continue — always clear client cookies regardless of backend reachability
  });

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}