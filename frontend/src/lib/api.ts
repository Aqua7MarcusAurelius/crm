const API_URL = 'http://localhost:3001';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

export async function api<T = any>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Ошибка сервера');
  }

  return data;
}