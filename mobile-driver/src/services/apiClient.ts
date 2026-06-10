import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch (error) {
    console.error('Failed to retrieve auth token:', error);
    return null;
  }
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://noori-backend-750921372930.asia-south1.run.app/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;
