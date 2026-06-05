import { apiUrl, getToken } from "@/lib/auth";

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface DriverDocument {
  id: string;
  driver: {
    id: string;
    name?: string | null;
    user?: {
      name?: string | null;
      phone?: string | null;
    } | null;
  };
  type: 'LICENSE' | 'VEHICLE_REGISTRATION' | 'NATIONAL_ID' | 'INSURANCE' | 'BACKGROUND_CHECK';
  url: string;
  status: DocumentStatus;
  createdAt: string;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export const getPendingKycDocuments = async (): Promise<DriverDocument[]> => {
  const response = await apiFetch('/users/admin/documents/pending');
  if (!response.ok) throw new Error(`Failed to fetch pending KYC documents (${response.status})`);
  return response.json();
};

export const updateDocumentStatus = async (
  id: string,
  status: 'VERIFIED' | 'REJECTED'
): Promise<DriverDocument> => {
  const response = await apiFetch(`/users/admin/documents/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`Failed to update document ${id} (${response.status})`);
  return response.json();
};

export const getFullImageUrl = (relativeUrl: string): string => {
  const backendBaseUrl = apiUrl.replace(/\/api\/?$/, '');
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl;
  const cleanUrl = relativeUrl.replace(/^\/+/, '');
  if (cleanUrl.startsWith('files/')) return `${backendBaseUrl}/${cleanUrl}`;
  return `${backendBaseUrl}/files/kyc/${cleanUrl}`;
};
