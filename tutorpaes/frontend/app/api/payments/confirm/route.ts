import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// This route confirms a Transbank payment via the Python backend

async function handleWebpayResponse(token: string | null, isCancellation: boolean, baseUrl: string) {
  if (isCancellation || !token) {
    return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=cancelled`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/payments/confirm?token_ws=${token}`);
    const confirmData = await response.json() as { success?: boolean };

    if (response.ok && confirmData?.success) {
      return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=success`);
    } else {
      return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=failed`);
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=failed`);
  }
}

// Transbank Webpay Plus normalmente retorna usando GET
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token_ws');
  const tbkToken = searchParams.get('TBK_TOKEN'); 
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return handleWebpayResponse(token, !!tbkToken, baseUrl);
}

// Soporte de respaldo por si el entorno envía un POST
export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const formData = await request.formData();
    const token = formData.get('token_ws') as string | null;
    const tbkToken = formData.get('TBK_TOKEN') as string | null;

    return handleWebpayResponse(token, !!tbkToken, baseUrl);
  } catch {
    return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=failed`);
  }
}