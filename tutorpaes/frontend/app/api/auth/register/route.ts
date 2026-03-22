import { NextRequest } from 'next/server';

import { API_BASE_URL, relayAuthResponse } from '@/src/lib/server/auth-session';

export async function POST(request: NextRequest) {
  const body = await request.text();

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  return relayAuthResponse(response);
}