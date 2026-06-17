import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'noori_cache_';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export async function saveCache<T>(key: string, data: T): Promise<void> {
  try {
    const item = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (e) {
    console.warn('Failed to save cache', e);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp > CACHE_EXPIRY) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return item.data as T;
  } catch (e) {
    console.warn('Failed to get cache', e);
    return null;
  }
}

export async function clearCache(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (e) {
    console.warn('Failed to clear cache', e);
  }
}

// Specific helpers
export const TRIPS_CACHE_KEY = 'trips';
export const ORDERS_CACHE_KEY = 'orders';
export const DELIVERIES_CACHE_KEY = 'deliveries';