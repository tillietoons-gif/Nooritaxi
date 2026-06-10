import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://noori-backend-750921372930.asia-south1.run.app/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL.replace(/\/api\/?$/, '');

const TOKEN_KEY = 'noori_token';
const USER_KEY = 'noori_user';
const SAVED_PLACES_KEY = 'noori_saved_places';

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

export type AuthRole = AuthUser['role'];

export type TripStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type DeliveryStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type AuthResponse = {
  access_token: string;
  user: AuthUser;
};

export function isDriverUser(user?: Pick<AuthUser, 'role'> | null) {
  return user?.role === 'DRIVER';
}

export function isMerchantUser(user?: Pick<AuthUser, 'role'> | null) {
  return user?.role === 'MERCHANT';
}

export function getSignedInRoute(user?: Pick<AuthUser, 'role'> | null) {
  return user ? '/(tabs)/home' : '/(auth)/login';
}

export function getNextDriverTripStatus(status?: TripStatus | null): TripStatus | null {
  if (status === 'REQUESTED') return 'ACCEPTED';
  if (status === 'ACCEPTED') return 'DRIVER_ARRIVED';
  if (status === 'DRIVER_ARRIVED') return 'IN_PROGRESS';
  if (status === 'IN_PROGRESS') return 'COMPLETED';
  return null;
}

export function getDriverTripActionLabel(status?: TripStatus | null) {
  if (status === 'REQUESTED') return 'Accept trip';
  if (status === 'ACCEPTED') return 'Mark arrived';
  if (status === 'DRIVER_ARRIVED') return 'Start trip';
  if (status === 'IN_PROGRESS') return 'Complete trip';
  return null;
}

export function getNextDriverDeliveryStatus(
  status?: DeliveryStatus | null,
): DeliveryStatus | null {
  if (status === 'ASSIGNED') return 'PICKED_UP';
  if (status === 'PICKED_UP') return 'IN_TRANSIT';
  if (status === 'IN_TRANSIT') return 'DELIVERED';
  return null;
}

export function getDriverDeliveryActionLabel(status?: DeliveryStatus | null) {
  if (status === 'ASSIGNED') return 'Picked up';
  if (status === 'PICKED_UP') return 'Start delivery';
  if (status === 'IN_TRANSIT') return 'Mark delivered';
  return null;
}

export type Trip = {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: TripStatus;
  fare?: number | string | null;
  safetyCode?: string | null;
  requestedAt?: string;
  createdAt?: string;
  driver?: AuthUser | null;
};

export type Delivery = {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  pickupName?: string | null;
  dropoffName?: string | null;
  packageType?: string | null;
  packageWeightKg?: number | null;
  status: DeliveryStatus;
  fee?: number | string | null;
  requestedAt?: string;
  deliveredAt?: string | null;
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
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  distance?: number;
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
  isRead?: boolean;
};

export type Restaurant = {
  id: string;
  ownerId?: string;
  name: string;
  description?: string;
  cuisineTypes: string[];
  ratingAverage: number;
  status?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  deliveryRadius?: number;
  imageUrl?: string;
  avgPrepMinutes?: number;
  menuItems?: MenuItem[];
  menu?: MenuItem[];
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  imageUrl?: string;
  category?: string | null;
  isAvailable?: boolean;
  preparationMin?: number | null;
};

export type FoodOrderStatus =
  | 'CART'
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type FoodOrder = {
  id: string;
  riderId: string;
  restaurantId: string;
  status: FoodOrderStatus;
  subtotal: number | string;
  deliveryFee: number | string;
  discount: number | string;
  total: number | string;
  deliveryAddress: string;
  notes?: string | null;
  createdAt: string;
  placedAt?: string;
  items?: {
    id: string;
    quantity: number;
    unitPrice: number | string;
    menuItem?: MenuItem;
  }[];
  restaurant?: Restaurant;
  delivery?: Delivery | null;
};

export type DriverProfile = {
  id: string;
  userId: string;
  status: 'OFFLINE' | 'ONLINE' | 'BUSY' | 'SUSPENDED';
  currentLat?: number | null;
  currentLng?: number | null;
  completedTrips?: number;
  completedDeliveries?: number;
  ratingAverage?: number;
};

export type LoyaltyAccount = {
  id: string;
  userId: string;
  points: number;
  lifetime: number;
  tier: string;
};

export type LoyaltyTransaction = {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  createdAt: string;
};

export type Promotion = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  type: string;
  value: number | string;
  minSpend?: number | string | null;
  maxDiscount?: number | string | null;
  endsAt: string;
};

export type SavedPlace = {
  id: string;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
};

export type PlaceSuggestion = {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  lat: number;
  lng: number;
  category?: string | null;
};

export type SupportTicket = {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: Record<string, unknown> | null;
  updatedAt: string;
  createdAt: string;
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
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
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

export async function register(
  name: string,
  phone: string,
  password: string,
  role: AuthRole = 'RIDER',
) {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, phone, password, role }),
  });
  const data = await readJson<AuthResponse>(response, 'Registration failed');
  await saveSession(data.access_token, data.user);
  return data;
}

export async function getTrips(userId: string) {
  const response = await apiFetch(`/trips?userId=${encodeURIComponent(userId)}&limit=25`);
  return readJson<Trip[]>(response, 'Unable to load trips');
}

export async function getDeliveries(userId: string) {
  const response = await apiFetch(`/logistics/deliveries?userId=${encodeURIComponent(userId)}&limit=25`);
  return readJson<Delivery[]>(response, 'Unable to load deliveries');
}

export async function updateTripStatus(
  tripId: string,
  status: TripStatus,
  actorId?: string,
) {
  const response = await apiFetch(`/trips/${encodeURIComponent(tripId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, actorId }),
  });
  return readJson<Trip>(response, 'Unable to update trip status');
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

export async function transferWallet(payload: {
  userId: string;
  amount: number;
  currency: string;
  description: string;
  orderId?: string;
  tripId?: string;
  deliveryId?: string;
}) {
  const response = await apiFetch('/wallet/transfer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<any>(response, 'Insufficient wallet balance');
}

export async function getRideEstimate(distance = 5, lat?: number, lng?: number) {
  const params = new URLSearchParams({ distance: String(distance) });
  if (lat != null) params.set('lat', String(lat));
  if (lng != null) params.set('lng', String(lng));

  const response = await apiFetch(`/trips/estimate?${params.toString()}`);
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

export async function createRestaurant(payload: {
  ownerId: string;
  name: string;
  description?: string;
  phone?: string;
  address: string;
  cuisineTypes: string[];
  deliveryRadius?: number;
  avgPrepMinutes?: number;
}) {
  const response = await apiFetch('/food/restaurants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<Restaurant>(response, 'Unable to create restaurant');
}

export async function getRestaurantMenu(restaurantId: string) {
  const response = await apiFetch(`/food/restaurants/${encodeURIComponent(restaurantId)}/menu`);
  return readJson<MenuItem[]>(response, 'Unable to load menu');
}

export async function addRestaurantMenuItem(
  restaurantId: string,
  payload: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    category?: string;
    isAvailable?: boolean;
    preparationMin?: number;
  },
) {
  const response = await apiFetch(`/food/restaurants/${encodeURIComponent(restaurantId)}/menu-items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<MenuItem>(response, 'Unable to add menu item');
}

export async function updateRestaurantMenuItem(
  restaurantId: string,
  itemId: string,
  payload: Partial<{
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    isAvailable: boolean;
    preparationMin: number;
  }>,
) {
  const response = await apiFetch(
    `/food/restaurants/${encodeURIComponent(restaurantId)}/menu-items/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  return readJson<MenuItem>(response, 'Unable to update menu item');
}

export async function deleteRestaurantMenuItem(restaurantId: string, itemId: string) {
  const response = await apiFetch(
    `/food/restaurants/${encodeURIComponent(restaurantId)}/menu-items/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
  );
  return readJson<{ id: string; removed: boolean }>(response, 'Unable to remove menu item');
}

export async function placeFoodOrder(payload: {
  riderId: string;
  restaurantId: string;
  items: { menuItemId: string; quantity: number }[];
  deliveryAddress: string;
}) {
  const response = await apiFetch('/food/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<any>(response, 'Unable to place order');
}

export async function getFoodOrders(params: { userId?: string; restaurantId?: string } = {}) {
  const search = new URLSearchParams({ limit: '50' });
  if (params.userId) search.set('userId', params.userId);
  if (params.restaurantId) search.set('restaurantId', params.restaurantId);

  const response = await apiFetch(`/food/orders?${search.toString()}`);
  return readJson<FoodOrder[]>(response, 'Unable to load orders');
}

export async function updateFoodOrderStatus(
  orderId: string,
  status: FoodOrderStatus,
  actorId?: string,
) {
  const response = await apiFetch(`/food/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, actorId }),
  });
  return readJson<FoodOrder>(response, 'Unable to update order');
}

export async function updateMyDriverStatus(input: {
  status: 'ONLINE' | 'OFFLINE';
  lat?: number;
  lng?: number;
}) {
  const response = await apiFetch('/drivers/me/status', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return readJson<DriverProfile>(response, 'Unable to update driver availability');
}

export async function getMyLoyalty() {
  const response = await apiFetch('/loyalty/me');
  return readJson<{
    account: LoyaltyAccount;
    recentTransactions: LoyaltyTransaction[];
  }>(response, 'Unable to load loyalty account');
}

export async function redeemLoyaltyPoints(points: number, reason: string) {
  const response = await apiFetch('/loyalty/redeem', {
    method: 'POST',
    body: JSON.stringify({ points, reason }),
  });
  return readJson<LoyaltyAccount>(response, 'Unable to redeem points');
}

export async function getPromotions() {
  const response = await apiFetch('/promotions');
  return readJson<Promotion[]>(response, 'Unable to load promotions');
}

export async function createPromotion(payload: {
  code: string;
  title: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY' | 'WALLET_CREDIT';
  scope?: 'RIDES' | 'FOOD' | 'DELIVERY' | 'WALLET' | 'GLOBAL';
  value: number;
  startsAt: string;
  endsAt: string;
}) {
  const response = await apiFetch('/promotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<Promotion>(response, 'Unable to create promotion');
}

export async function redeemPromotion(input: {
  code: string;
  userId: string;
  orderId?: string;
  tripId?: string;
  spend?: number;
}) {
  const response = await apiFetch('/promotions/redeem', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return readJson<{ discount: number }>(response, 'Unable to redeem promotion');
}

export async function searchPlaces(query: string) {
  const response = await apiFetch(`/places?q=${encodeURIComponent(query)}&limit=8`);
  return readJson<PlaceSuggestion[]>(response, 'Unable to search places');
}

export async function createReview(payload: {
  authorId: string;
  targetType: 'DRIVER' | 'RIDER' | 'RESTAURANT';
  rating: number;
  comment?: string;
  tripId?: string;
  orderId?: string;
  deliveryId?: string;
  targetUserId?: string;
  restaurantId?: string;
}) {
  const response = await apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<any>(response, 'Unable to submit review');
}

export async function createSupportTicket(payload: {
  requesterId: string;
  category: string;
  subject: string;
  description: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: Record<string, unknown>;
}) {
  const response = await apiFetch('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<any>(response, 'Unable to submit request');
}

export async function getMySupportTickets() {
  const response = await apiFetch('/support/tickets/me');
  return readJson<SupportTicket[]>(response, 'Unable to load support tickets');
}

export async function getSavedPlaces() {
  const raw = await getStoredValue(SAVED_PLACES_KEY);
  if (!raw) return [] as SavedPlace[];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedPlace[]) : [];
  } catch {
    return [];
  }
}

export async function saveSavedPlaces(places: SavedPlace[]) {
  await setStoredValue(SAVED_PLACES_KEY, JSON.stringify(places));
}

export async function addSavedPlace(input: Omit<SavedPlace, 'id'>) {
  const places = await getSavedPlaces();
  const nextPlace = { ...input, id: `place:${Date.now()}` };
  const nextPlaces = [nextPlace, ...places].slice(0, 10);
  await saveSavedPlaces(nextPlaces);
  return nextPlace;
}

export async function removeSavedPlace(placeId: string) {
  const places = await getSavedPlaces();
  await saveSavedPlaces(places.filter((place) => place.id !== placeId));
}

export async function uploadMediaFile(fileUri: string) {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || `media-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const ext = match?.[1]?.toLowerCase();
  const mimeType = ext === 'webp' ? 'image/webp' : `image/${ext || 'jpeg'}`;

  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: mimeType,
  } as any);

  const response = await apiFetch('/kyc/media', {
    method: 'POST',
    body: formData,
  });
  const data = await readJson<{ url: string }>(response, 'Unable to upload photo');
  return data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`;
}

export async function createDelivery(payload: {
  senderId: string;
  pickupAddress: string;
  dropoffAddress: string;
  packageType: string;
  packageWeightKg: number;
}) {
  const response = await apiFetch('/logistics/deliveries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<any>(response, 'Unable to request delivery');
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  actorId?: string,
) {
  const response = await apiFetch(`/logistics/deliveries/${encodeURIComponent(deliveryId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, actorId }),
  });
  return readJson<Delivery>(response, 'Unable to update delivery status');
}

export async function uploadKycDocument(driverId: string, type: string, url: string) {
  const response = await apiFetch(`/users/${encodeURIComponent(driverId)}/documents`, {
    method: 'POST',
    body: JSON.stringify({ type, url }),
  });
  return readJson<any>(response, 'Unable to upload KYC document');
}

export async function uploadKycDocumentFile(type: string, fileUri: string) {
  const formData = new FormData();
  formData.append('documentType', type);
  
  const filename = fileUri.split('/').pop() || `document-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const ext = match?.[1];
  const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext || 'jpeg'}`;

  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: mimeType,
  } as any);

  const response = await apiFetch('/kyc/upload', {
    method: 'POST',
    body: formData,
  });
  
  return readJson<any>(response, 'Unable to upload KYC document');
}

// ---------- Payment ----------

export async function createPaymentIntent(payload: {
  userId: string;
  amount: number;
  currency: string;
  provider: string;
  orderId?: string;
  tripId?: string;
  deliveryId?: string;
}) {
  const response = await apiFetch('/payments/intent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readJson<{
    intentId: string;
    clientSecret: string;
    provider: string;
    amount: number;
    currency: string;
    status: string;
  }>(response, 'Unable to initialize payment');
}

export async function verifyPayment(intentId: string, providerRef: string) {
  const response = await apiFetch('/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ intentId, providerRef }),
  });
  return readJson<any>(response, 'Unable to verify payment');
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
