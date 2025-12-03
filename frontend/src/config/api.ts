// API Base URL - ajuste conforme necessário
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  CONVERSATIONS: '/conversations',
  CHAT: '/chat',
  DOCUMENTS: {
    BASE: '/documents',
    UPLOAD: '/documents/upload',
    BY_CONVERSATION: (conversationId: number) => `/documents/conversation/${conversationId}`,
    BY_ID: (documentId: number) => `/documents/${documentId}`,
    DOWNLOAD: (documentId: number) => `/documents/${documentId}/download`,
    DELETE: (documentId: number) => `/documents/${documentId}`,
  },
} as const;
