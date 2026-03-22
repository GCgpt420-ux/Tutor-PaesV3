/**
 * Auth API Module
 *
 * Centraliza todas las operaciones de autenticación vía rutas internas del frontend.
 */

import { apiFetch } from '@/src/lib/api/client';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export async function signUp(data: SignUpData) {
  const payload = {
    email: data.email,
    password: data.password,
    name: data.fullName ?? data.email.split('@')[0],
  };

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.detail || 'No se pudo registrar el usuario');
  }

  return response.json();
}

export async function signIn(data: SignInData) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.detail || 'No se pudo iniciar sesión');
  }

  return response.json();
}

export async function signOut() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('No se pudo cerrar la sesión');
  }

  return response.json();
}

export async function resetPassword(email: string) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function updatePassword(data: { token: string; new_password: string; confirm_password: string }) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: data,
  });
}
