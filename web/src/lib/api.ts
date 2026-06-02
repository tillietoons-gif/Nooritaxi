import axios from 'axios';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DriverDocument {
  id: string;
  driver: {
    id: string;
    name: string;
  };
  documentType: 'LICENSE' | 'VEHICLE_REGISTRATION' | 'NATIONAL_ID';
  url: string;
  status: DocumentStatus;
  createdAt: string;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getPendingKycDocuments = async (): Promise<DriverDocument[]> => {
  try {
    const response = await api.get<DriverDocument[]>('/driver-documents/pending');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pending KYC documents:', error);
    return [];
  }
};

export const updateDocumentStatus = async (
  id: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<DriverDocument> => {
  try {
    const response = await api.patch<DriverDocument>(`/driver-documents/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Failed to update document ${id} to status ${status}:`, error);
    throw error;
  }
};

export const getFullImageUrl = (relativeUrl: string): string => {
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:3000';
  return `${backendBaseUrl}/${relativeUrl.replace(/^\//, '')}`;
};
