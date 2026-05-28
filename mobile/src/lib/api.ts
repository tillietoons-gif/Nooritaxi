const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://noori-backend-750921372930.asia-south1.run.app/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
}

export async function login(phone: string, password: string) {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Login failed');
  setAuthToken(data.access_token);
  return data;
}

export async function register(name: string, phone: string, password: string) {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, phone, password, role: 'RIDER' }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Registration failed');
  setAuthToken(data.access_token);
  return data;
}
