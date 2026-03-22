import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// This endpoint proxies payment creation to the Python backend service

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plan = body.plan || 'monthly';
    const token = request.cookies.get('access_token')?.value;

    const response = await fetch(`${API_BASE_URL}/api/v1/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ plan }),
    });

    const paymentData = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: paymentData?.detail || 'Error al crear el pago' },
        { status: response.status }
      );
    }

    return NextResponse.json(paymentData);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de pago' },
      { status: 500 }
    );
  }
}