import { NextRequest, NextResponse } from 'next/server';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://127.0.0.1:8000';

// This AI explanation endpoint proxies to the Python backend AI service

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question_id = Number(body?.question_id ?? body?.questionId);

    if (!question_id) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      );
    }

    const token = request.cookies.get('access_token')?.value;

    // Llamamos a la versión 'stream' del backend en Python
    const response = await fetch(`${API_BASE_URL}/api/v1/ai/explain/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question_id }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: 'Failed to generate explanation', details: errorBody },
        { status: response.status }
      );
    }

    // Retornamos el pipeline de streaming nativo hacia el cliente sin esperar json()
    // Aseguramos que los headers para SSE perduren
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache, no-transform');
    headers.set('Connection', 'keep-alive');
    headers.set('Content-Encoding', 'none'); 

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('AI Explain Stream Proxy Error:', error);

    return NextResponse.json(
      {
        error: 'Tutor IA interrumpió la conexión o no está disponible.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Para verificar que el endpoint está disponible
 */
export async function GET() {
  return NextResponse.json({
    message: 'AI Explain endpoint active',
    methods: ['POST'],
    documentation: '/docs/api/ai/explain',
  });
}
