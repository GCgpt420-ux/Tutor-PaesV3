import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '@/src/lib/server/auth-session';

async function forwardRequest(request: NextRequest, path: string[]) {
  const accessToken = request.cookies.get('access_token')?.value;
  const targetUrl = `${API_BASE_URL}/api/v1/${path.join('/')}${request.nextUrl.search}`;
  const method = request.method;
  const headers = new Headers();

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();
  const backendResponse = await fetch(targetUrl, {
    method,
    headers,
    body,
  });

  const responseBody = await backendResponse.arrayBuffer();
  const responseHeaders = new Headers();
  const responseContentType = backendResponse.headers.get('content-type');

  if (responseContentType) {
    responseHeaders.set('Content-Type', responseContentType);
  }

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}