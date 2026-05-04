import { NextRequest, NextResponse } from 'next/server';

/**
 * Frontend proxy for AI chat endpoint
 * Forwards requests to backend FastAPI SSE stream
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers (Authorization: Bearer <token>)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authorization header' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, attempt_id } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Bad request: Missing message field' },
        { status: 400 }
      );
    }

    // Determine backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const chatUrl = `${backendUrl}/api/v1/ai/chat`;

    // Forward request to backend with streaming
    const backendResponse = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        message,
        attempt_id: attempt_id || null,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend AI chat error: ${backendResponse.status}`, errorText);
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}` },
        { status: backendResponse.status }
      );
    }

    // Stream the response back to client
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');

    // Create a ReadableStream from backend response
    const reader = backendResponse.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: 'Failed to get response stream' },
        { status: 500 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error('AI chat proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
