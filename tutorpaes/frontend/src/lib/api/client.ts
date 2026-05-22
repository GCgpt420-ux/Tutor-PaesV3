const API_PROXY_BASE =
  process.env.NEXT_PUBLIC_API_URL?.startsWith('/')
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
    : '/api/backend';

let refreshPromise: Promise<boolean> | null = null;

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
};

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}, allowRefresh = true) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_PROXY_BASE}${cleanEndpoint}`;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers,
    body: options.body && typeof options.body === 'object' 
      ? JSON.stringify(options.body) 
      : options.body
  };

  const res = await fetch(url, config);

  if (res.status === 401) {
    if (allowRefresh) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiFetch<T>(endpoint, options, false);
      }
    }

    redirectToLogin();
    throw new Error('Token expirado. Por favor, inicia sesión de nuevo.');
  }

  if (!res.ok) {
    let errBody: Record<string, unknown> = {};
    try {
      errBody = await res.json();
    } catch {}
    // FastAPI suele enviar los errores en el campo 'detail'
    const message = 
      (typeof errBody?.detail === 'string' ? errBody.detail : JSON.stringify(errBody?.detail)) ||
      (typeof errBody?.error === 'string' ? errBody.error : JSON.stringify(errBody?.error)) ||
      (typeof errBody?.message === 'string' ? errBody.message : JSON.stringify(errBody?.message)) ||
      res.statusText;
    console.error('Error de API', { status: res.status, errBody, message });
    throw new Error(message);
  }

  return (await res.json()) as T;
}