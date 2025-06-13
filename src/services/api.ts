// src/services/api.ts

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
  data?: T;
}

export interface User {
  id: number;
  email: string;
  name: string;
  preferredLanguage: string;
  storageUsed?: number;
  maxStorage?: number;
}

export interface Document {
  id: number;
  original_name: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: string;
  upload_date: string;
  analysis_date?: string;
  access_count: number;
  tags?: string[];
  summary?: string;
  clauses?: string[];
  risks?: string[];
  suggestions?: string[];
  s3_url?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authAPI = {
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(userData: { email: string; password: string; name: string; preferredLanguage?: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.json();
  }
};

export const documentAPI = {
  async uploadDocument(formData: FormData): Promise<ApiResponse<{ document: Document }>> {
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders()
    });
    return response.json();
  },

  async getMyDocuments(params: { page?: number; limit?: number; status?: string; search?: string; documentType?: string } = {}): Promise<ApiResponse<{ documents: Document[]; pagination: any }>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const response = await fetch(`${API_BASE_URL}/api/documents/my-documents?${queryString}`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  async getDocument(documentId: number | string): Promise<ApiResponse<{ document: Document }>> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  async downloadDocument(documentId: number | string): Promise<ApiResponse<{ downloadUrl: string }>> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/download`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.success && data.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
    }
    return data;
  },

  async deleteDocument(documentId: number | string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
