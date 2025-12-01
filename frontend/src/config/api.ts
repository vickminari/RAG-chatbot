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
} as const;
