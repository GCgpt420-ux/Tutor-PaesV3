import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

async function forwardRequest(request: NextRequest, path: string[]) {
  try {
    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('access_token')?.value;
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader || (cookieToken ? `Bearer ${cookieToken}` : undefined);
    
    const hasTrailingSlash = request.nextUrl.pathname.endsWith('/');
    const targetUrl = `${API_BASE_URL}/api/v1/${path.join('/')}${hasTrailingSlash ? '/' : ''}${request.nextUrl.search}`;
    const method = request.method;
    const headers = new Headers();

    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    if (accessToken) {
      headers.set('Authorization', accessToken);
    }

    const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
    console.log(`[Proxy] ${method} ${targetUrl}`);
    
    const backendResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      // Required by undici when forwarding request bodies in some runtimes.
      // @ts-expect-error duplex is not in all TS lib versions yet.
      duplex: body ? 'half' : undefined,
    });

    // Preserve streaming semantics (SSE/chunked) by returning the backend body directly.
    const responseHeaders = new Headers(backendResponse.headers);
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy Error]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
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