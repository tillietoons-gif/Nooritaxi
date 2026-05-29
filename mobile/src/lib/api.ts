import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://noori-backend-750921372930.asia-south1.run.app/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL.replace(/\/api\/?$/, '');

const TOKEN_KEY = 'noori_token';
const USER_KEY = 'noori_user';

let authToken: string | null = null;

async function getStoredValue(key: string) {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredValue(key: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export type AuthUser = {
  id: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  role: 'RIDER' | 'DRIVER' | 'MERCHANT' | 'SUPPORT' | 'ADMIN';
};

export type AuthResponse = {
  access_token: string;
  user: AuthUser;
};

export type Trip = {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  fare?: number | string | null;
  safetyCode?: string | null;
  requestedAt?: string;
  createdAt?: string;
};

export type WalletBalance = {
  id: string;
  balance: number | string;
  currency: string;
};

export type WalletTransaction = {
  id: string;
  amount: number | string;
  type: string;
  description?: string | null;
  createdAt: string;
};

export type RidePayload = {
  customerId: string;
  pickupLocation: string;
  dropoffLocation: string;
  paymentMethod?: 'CASH' | 'WALLET';
};

export type RideEstimate = {
  fare: number;
  currency: string;
  distance: number;
  surgeMultiplier: number;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type Restaurant = {
  id: string;
  name: string;
  description?: string;
  cuisineTypes: string[];
  ratingAverage: number;
  deliveryRadius?: number;
  imageUrl?: string;
  avgPrepMinutes?: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
};

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function getAuthToken() {
  if (authToken) return authToken;
  authToken = await getStoredValue(TOKEN_KEY);
  return authToken;
}

export async function getStoredUser() {
  const raw = await getStoredValue(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function saveSession(token: string, user: AuthUser) {
  authToken = token;
  await setStoredValue(TOKEN_KEY, token);
  await setStoredValue(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  authToken = null;
  await deleteStoredValue(TOKEN_KEY);
  await deleteStoredValue(USER_KEY);
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAuthToken();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? fallback);
  return data as T;
}

export async function login(phone: string, password: string) {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  const data = await readJson<AuthResponse>(response, 'Login failed');
  await saveSession(data.access_token, data.user);
  return data;
}

export async function register(name: string, phone: string, password: string) {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, phone, password, role: 'RIDER' }),
  });
  const data = await readJson<AuthResponse>(response, 'Registration failed');
  await saveSession(data.access_token, data.user);
  return data;
}

export async function getTrips(userId: string) {
  const response = await apiFetch(`/trips?userId=${encodeURIComponent(userId)}&limit=25`);
  return readJson<Trip[]>(response, 'Unable to load trips');
}

export async function getWalletBalance(userId: string) {
  const response = await apiFetch(`/wallet/${encodeURIComponent(userId)}?type=CUSTOMER&currency=AFN`);
  if (response.status === 404) return null;
  return readJson<WalletBalance | null>(response, 'Unable to load wallet');
}

export async function getTransactions(userId: string) {
  const response = await apiFetch(`/wallet/${encodeURIComponent(userId)}/transactions?page=1&limit=25`);
  const data = await readJson<{ items: WalletTransaction[] }>(response, 'Unable to load transactions');
  return data.items;
}

export async function topUpWallet(userId: string, amount: number) {
  const response = await apiFetch(`/wallet/${encodeURIComponent(userId)}/deposit`, {
    method: 'POST',
    body: JSON.stringify({
      amount,
      type: 'CUSTOMER',
      currency: 'AFN',
      description: 'Mobile wallet top up',
      idempotencyKey: `mobile-topup:${userId}:${Date.now()}`,
    }),
  });
  return readJson<WalletBalance>(response, 'Unable to top up wallet');
}

export async function getRideEstimate(distance = 5) {
  const response = await apiFetch(`/trips/estimate?distance=${distance}`);
  return readJson<RideEstimate>(response, 'Unable to estimate fare');
}

export async function bookRide(payload: RidePayload) {
  const response = await apiFetch('/trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<Trip>(response, 'Unable to book ride');
}

export async function getNotifications(userId: string) {
  const response = await apiFetch(`/notifications/${encodeURIComponent(userId)}`);
  return readJson<NotificationItem[]>(response, 'Unable to load notifications');
}

export async function getRestaurants() {
  const response = await apiFetch('/food/restaurants');
  return readJson<Restaurant[]>(response, 'Unable to load restaurants');
}

export async function getRestaurantMenu(restaurantId: string) {
  const response = await apiFetch(`/food/restaurants/${encodeURIComponent(restaurantId)}/menu`);
  return readJson<MenuItem[]>(response, 'Unable to load menu');
}

export async function uploadKycDocument(driverId: string, type: string, url: string) {
  const response = await apiFetch(`/users/${encodeURIComponent(driverId)}/documents`, {
    method: 'POST',
    body: JSON.stringify({ type, url }),
  });
  return readJson<any>(response, 'Unable to upload KYC document');
}

// ---------- Safety ----------

export type TrustedContact = {
  id: string;
  name: string;
  phone: string;
  relation?: string | null;
  notifyOnSos: boolean;
  notifyOnTrip: boolean;
};

export type SosResult = {
  alert: { id: string; status: string; createdAt: string };
  notifiedContacts: number;
  shareUrl: string | null;
};

export async function listTrustedContacts() {
  const response = await apiFetch('/safety/contacts');
  return readJson<TrustedContact[]>(response, 'Unable to load trusted contacts');
}

export async function addTrustedContact(input: {
  name: string;
  phone: string;
  relation?: string;
  notifyOnSos?: boolean;
  notifyOnTrip?: boolean;
}) {
  const response = await apiFetch('/safety/contacts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return readJson<TrustedContact>(response, 'Unable to add trusted contact');
}

export async function removeTrustedContact(contactId: string) {
  const response = await apiFetch(`/safety/contacts/${encodeURIComponent(contactId)}`, {
    method: 'DELETE',
  });
  return readJson<{ id: string; removed: boolean }>(response, 'Unable to remove contact');
}

export async function raiseSos(input: {
  tripId?: string;
  lat?: number;
  lng?: number;
  message?: string;
}) {
  const response = await apiFetch('/safety/sos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return readJson<SosResult>(response, 'Unable to raise SOS');
}

export async function resolveSos(alertId: string) {
  const response = await apiFetch(`/safety/sos/${encodeURIComponent(alertId)}/resolve`, {
    method: 'PATCH',
  });
  return readJson<{ id: string; status: string }>(response, 'Unable to resolve SOS');
}

export async function getRestaurant(id: string) {
  const response = await apiFetch(`/restaurants/${encodeURIComponent(id)}`);
  return readJson<Restaurant & { menu: MenuItem[] }>(response, 'Unable to get restaurant');
}

export async function placeOrder(payload: any) {
  const response = await apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<{ id: string; status: string }>(response, 'Unable to place order');
}
